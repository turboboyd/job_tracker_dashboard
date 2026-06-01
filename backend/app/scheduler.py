"""Background auto-discovery scheduler.

Runs as an asyncio task (started via FastAPI lifespan).  Every TICK_SECONDS it
queries loops whose next_run_at is due, fires a discovery run for each one, and
lets _persist_history reschedule next_run_at on success.
"""

from __future__ import annotations

import asyncio
import logging
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.db.models.loop import Loop
from app.db.models.user import User
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopsService

logger = logging.getLogger(__name__)

TICK_SECONDS = 60


async def scheduler_tick(factory: async_sessionmaker[AsyncSession]) -> None:
    now = datetime.now(timezone.utc)

    async with factory() as db:
        due = list(
            (
                await db.execute(
                    select(Loop).where(
                        Loop.auto_discovery_enabled.is_(True),
                        Loop.status == "active",
                        Loop.next_run_at.is_not(None),
                        Loop.next_run_at <= now,
                    )
                )
            ).scalars()
        )

        if not due:
            return

        logger.info("Scheduler: %d loop(s) due for auto-discovery", len(due))

        for loop in due:
            user = (
                await db.execute(select(User).where(User.id == loop.user_id))
            ).scalar_one_or_none()

            if user is None:
                logger.warning("Scheduler: no user for loop %s — skipping", loop.id)
                continue

            try:
                loops_svc = LoopsService(db)
                runs_svc = DiscoveryRunsService(loops=loops_svc, db=db)
                payload = DiscoveryRunRequest(
                    loop_id=str(loop.id),
                    dry_run=False,
                    search_scope="normal",
                    page=1,
                    page_size=5,
                )
                await runs_svc.run(user=user, payload=payload)
                await db.commit()
                logger.info("Scheduler: completed auto-run for loop %s", loop.id)
            except Exception:
                logger.warning(
                    "Scheduler: auto-run failed for loop %s", loop.id, exc_info=True
                )
                await db.rollback()


async def run_scheduler(factory: async_sessionmaker[AsyncSession]) -> None:
    logger.info("Auto-discovery scheduler started (tick=%ds)", TICK_SECONDS)
    while True:
        try:
            await scheduler_tick(factory)
        except Exception:
            logger.warning("Scheduler tick raised unexpectedly", exc_info=True)
        await asyncio.sleep(TICK_SECONDS)
