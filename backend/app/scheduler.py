"""Background discovery scheduler (cache-warm + match persistence).

Runs as an asyncio task (started via FastAPI lifespan). Every TICK_SECONDS it
finds active loops that have auto-discovery enabled and whose cache is due for a
refresh (next_run_at is null or in the past) and runs a real discovery pass for
each: freshly-found vacancies are persisted as "new" matches (deduped against
existing ones) and the preview cache is refreshed as a side effect. User-facing
requests then serve straight from the DB instead of hitting external job boards
on every page view, and the Matches list keeps filling with fresh vacancies
several times a day without the user pressing refresh.

Loops with auto-discovery DISABLED are never warmed by the scheduler — they only
gain matches when the user explicitly runs discovery. This keeps such loops
(e.g. dev-QA seed loops) stable and predictable.

This module owns ``Loop.next_run_at``: after running a loop it schedules the
next refresh. Refreshes are snapped to wall-clock boundaries aligned to
midnight Europe/Berlin (every WARM_INTERVAL_HOURS → 00:00, 04:00, 08:00 …
local), so the whole fleet warms on predictable, human-friendly times instead
of drifting by the runtime of each pass. Auto-discovery loops with a custom
interval keep their own cadence; those without one use the shared
WARM_INTERVAL_HOURS step.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from zoneinfo import ZoneInfo

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models.loop import Loop
from app.db.models.user import User
from app.modules.discovery_runs.cache_repository import cleanup_stale
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopsService

logger = logging.getLogger(__name__)

TICK_SECONDS = 60
# Default cadence for warming loops that don't have auto-discovery configured.
# Kept aligned with the longest public-source cache TTL (arbeitsagentur = 4h);
# shorter-TTL sources self-heal via on-demand background warms between ticks.
WARM_INTERVAL_HOURS = 4
# Backoff applied when a warm fails, so we don't retry a broken loop every tick.
FAILURE_BACKOFF_MINUTES = 30
# How often the stale-cache retention purge runs (it's a single cheap DELETE,
# no need to scan every 60s tick).
CLEANUP_INTERVAL_HOURS = 6

# Refreshes are aligned to midnight in this zone (00:00, 04:00, … local). Windows
# has no system tz database, so this resolves only when the ``tzdata`` package is
# installed; if it isn't we fall back to plain interval arithmetic.
try:
    BERLIN_TZ: ZoneInfo | None = ZoneInfo("Europe/Berlin")
except Exception:  # pragma: no cover - depends on host tz data availability
    BERLIN_TZ = None
    logger.warning(
        "Scheduler: Europe/Berlin tz data unavailable; refreshes fall back to "
        "drifting interval arithmetic (install the 'tzdata' package to fix)."
    )

_last_cleanup_at: datetime | None = None


def _interval_hours_for(loop: Loop) -> int:
    if loop.auto_discovery_enabled:
        return max(1, loop.discovery_interval_hours or WARM_INTERVAL_HOURS)
    return WARM_INTERVAL_HOURS


def _next_aligned_run_at(now: datetime, interval_hours: int) -> datetime:
    """Next wall-clock refresh boundary aligned to Berlin midnight.

    Boundaries fall every ``interval_hours`` starting at 00:00 Europe/Berlin
    (4h → 00, 04, 08, 12, 16, 20 local). Returns the first boundary strictly
    after ``now``, as an aware UTC datetime. DST-safe: it snaps the local hour
    with ``replace`` rather than adding a timedelta (which would be off by an
    hour across a DST transition). Falls back to ``now + interval`` when tz data
    is unavailable.
    """
    step = max(1, interval_hours)
    if BERLIN_TZ is None:
        return now + timedelta(hours=step)

    local = now.astimezone(BERLIN_TZ)
    for hour in range(0, 24, step):
        candidate = local.replace(hour=hour, minute=0, second=0, microsecond=0)
        if candidate > local:
            return candidate.astimezone(timezone.utc)
    # Past the last boundary of the day — roll over to tomorrow's midnight.
    tomorrow = (local + timedelta(days=1)).replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    return tomorrow.astimezone(timezone.utc)


async def _maybe_cleanup(db: AsyncSession, *, now: datetime) -> None:
    """Run the retention purge at most once per CLEANUP_INTERVAL_HOURS."""
    global _last_cleanup_at
    if (
        _last_cleanup_at is not None
        and now - _last_cleanup_at < timedelta(hours=CLEANUP_INTERVAL_HOURS)
    ):
        return
    try:
        await cleanup_stale(db, now=now)
        _last_cleanup_at = now
    except Exception:
        logger.warning("Scheduler: cache retention purge failed", exc_info=True)
        await db.rollback()


async def scheduler_tick(factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)

    async with factory() as db:
        await _maybe_cleanup(db, now=now)

        due = list(
            (
                await db.execute(
                    select(Loop).where(
                        Loop.status == "active",
                        Loop.auto_discovery_enabled.is_(True),
                        or_(
                            Loop.next_run_at.is_(None),
                            Loop.next_run_at <= now,
                        ),
                    )
                )
            ).scalars()
        )
        # Only loops that actually search something are worth warming.
        due = [loop for loop in due if loop.selected_sources]

        if not due:
            return

        logger.info("Scheduler: %d loop(s) due for cache warming", len(due))

        for loop in due:
            try:
                user = (
                    await db.execute(select(User).where(User.id == loop.user_id))
                ).scalar_one_or_none()

                if user is None:
                    logger.warning(
                        "Scheduler: no user for loop %s — deferring", loop.id
                    )
                    loop.next_run_at = now + timedelta(hours=WARM_INTERVAL_HOURS)
                    await db.commit()
                    continue

                runs_svc = DiscoveryRunsService(loops=LoopsService(db), db=db)
                # Each due auto-discovery loop runs a real (non-dry) pass so
                # freshly-found vacancies are persisted as "new" matches and
                # surface in the user's Matches list. The service dedupes against
                # existing matches, so re-warming a loop never double-creates
                # rows; it only adds genuinely new vacancies.
                payload = DiscoveryRunRequest(
                    loop_id=str(loop.id),
                    dry_run=False,
                    search_scope="normal",
                    page=1,
                    page_size=20,
                    cache_only=False,
                )
                await runs_svc.run(user=user, payload=payload)

                interval_h = _interval_hours_for(loop)
                loop.next_run_at = _next_aligned_run_at(now, interval_h)
                await db.commit()
                logger.info(
                    "Scheduler: warmed loop %s (next refresh at %s)",
                    loop.id,
                    loop.next_run_at.isoformat(),
                )
            except Exception:
                logger.warning(
                    "Scheduler: cache warming failed for loop %s", loop.id, exc_info=True
                )
                await db.rollback()
                # Apply a backoff so a persistently failing loop isn't retried
                # on every 60s tick.
                try:
                    loop.next_run_at = now + timedelta(minutes=FAILURE_BACKOFF_MINUTES)
                    await db.commit()
                except Exception:
                    await db.rollback()


async def run_scheduler(factory: async_sessionmaker[AsyncSession]) -> None:
    logger.info("Discovery cache-warming scheduler started (tick=%ds)", TICK_SECONDS)
    while True:
        try:
            await scheduler_tick(factory)
        except Exception:
            logger.warning("Scheduler tick raised unexpectedly", exc_info=True)
        await asyncio.sleep(TICK_SECONDS)
