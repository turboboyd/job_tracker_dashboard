"""Background cache warming for discovery previews.

Used by the discovery-runs router as a FastAPI BackgroundTask: when a
cache-only run reports a miss, we fetch those sources once (off the request
path), populate ``discovery_preview_cache``, and let the next user request /
poll serve straight from the database.

This keeps external job-board traffic bounded to one fetch per source per TTL
window instead of one per user request.
"""

from __future__ import annotations

import logging
from uuid import UUID

from sqlalchemy import select

from app.db.models.user import User
from app.db.session import get_session_factory
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopsService

logger = logging.getLogger(__name__)


async def warm_discovery_cache(
    *,
    loop_id: str,
    user_id: UUID,
    source_ids: list[str],
    search_scope: str,
    page: int,
    page_size: int,
) -> None:
    """Fetch the given sources for a loop and write the results to the cache.

    Runs with its own session (the request session is already closed by the
    time a BackgroundTask executes). All failures are swallowed and logged —
    warming must never surface an error to the user.
    """
    if not source_ids:
        return

    factory = get_session_factory()
    try:
        async with factory() as db:
            user = (
                await db.execute(select(User).where(User.id == user_id))
            ).scalar_one_or_none()
            if user is None:
                logger.warning("Cache warm: no user %s — skipping loop %s", user_id, loop_id)
                return

            runs_svc = DiscoveryRunsService(LoopsService(db), db=db)
            payload = DiscoveryRunRequest(
                loop_id=loop_id,
                dry_run=True,
                source_ids=source_ids,
                search_scope=search_scope,  # type: ignore[arg-type]
                page=page,
                page_size=page_size,
                cache_only=False,
            )
            await runs_svc.run(user=user, payload=payload)
            await db.commit()
            logger.info(
                "Cache warm: loop=%s sources=%s scope=%s page=%s",
                loop_id,
                source_ids,
                search_scope,
                page,
            )
    except Exception:
        logger.warning(
            "Cache warm failed (non-fatal): loop=%s sources=%s",
            loop_id,
            source_ids,
            exc_info=True,
        )
