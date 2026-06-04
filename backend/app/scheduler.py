"""Background discovery cache-warming scheduler.

Runs as an asyncio task (started via FastAPI lifespan). Every TICK_SECONDS it
finds active loops whose cache is due for a refresh (next_run_at is null or in
the past), fetches their selected sources once, and writes the results to
discovery_preview_cache. User-facing requests then serve straight from the DB
instead of hitting external job boards on every page view.

This module owns ``Loop.next_run_at``: after warming a loop it schedules the
next refresh. Auto-discovery loops use their configured interval; all other
active loops are warmed on a fixed WARM_INTERVAL_HOURS cadence so the cache
never goes fully cold.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timedelta, timezone

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

_last_cleanup_at: datetime | None = None


def _interval_hours_for(loop: Loop) -> int:
    if loop.auto_discovery_enabled:
        return max(1, loop.discovery_interval_hours or WARM_INTERVAL_HOURS)
    return WARM_INTERVAL_HOURS


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
                payload = DiscoveryRunRequest(
                    loop_id=str(loop.id),
                    dry_run=True,
                    search_scope="normal",
                    page=1,
                    page_size=20,
                    cache_only=False,
                )
                await runs_svc.run(user=user, payload=payload)

                interval_h = _interval_hours_for(loop)
                loop.next_run_at = now + timedelta(hours=interval_h)
                await db.commit()
                logger.info(
                    "Scheduler: warmed loop %s (next refresh in %dh)",
                    loop.id,
                    interval_h,
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
