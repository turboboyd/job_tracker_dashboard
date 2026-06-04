from __future__ import annotations

import logging
from datetime import datetime, timedelta
from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
from app.modules.discovery_adapters.safety import MAX_RESULTS_PER_SOURCE
from app.modules.discovery_adapters.schemas import DiscoveryAdapterItem, DiscoveryAdapterResult

logger = logging.getLogger(__name__)

DEFAULT_TTL_SECONDS: int = 3600  # 1 hour

# How long auto-fetched preview rows are retained before purging. Bounds the
# size of discovery_preview_cache: actively warmed loops refresh fetched_at
# every cycle so they never age out, while paused/inactive loops drop off after
# this window. Never touches user-saved jobs — those live in separate tables.
RETENTION_DAYS: int = 30

_SOURCE_TTL: dict[str, int] = {
    "arbeitsagentur": 4 * 3600,
    "arbeitnow": 2 * 3600,
    "remotive": 2 * 3600,
    "remotejobs": 2 * 3600,
    "himalayas": 2 * 3600,
    "remoteok": 2 * 3600,
    "adzuna": 1 * 3600,
    "greenhouse": 6 * 3600,
    "lever": 6 * 3600,
}


def get_ttl_seconds(source_id: str) -> int:
    return _SOURCE_TTL.get(source_id, DEFAULT_TTL_SECONDS)


async def get_fresh_cache(
    db: AsyncSession,
    *,
    loop_id: UUID,
    source_id: str,
    search_scope: str,
    page: int,
    now: datetime,
) -> DiscoveryPreviewCache | None:
    stmt = select(DiscoveryPreviewCache).where(
        DiscoveryPreviewCache.loop_id == loop_id,
        DiscoveryPreviewCache.source_id == source_id,
        DiscoveryPreviewCache.search_scope == search_scope,
        DiscoveryPreviewCache.page == page,
        DiscoveryPreviewCache.expires_at > now,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def upsert_cache(
    db: AsyncSession,
    *,
    loop_id: UUID,
    source_id: str,
    search_scope: str,
    page: int,
    result: DiscoveryAdapterResult,
    now: datetime,
) -> None:
    ttl_seconds = get_ttl_seconds(source_id)
    expires_at = now + timedelta(seconds=ttl_seconds)
    items_json = [item.model_dump() for item in result.items]
    has_more = len(result.items) >= MAX_RESULTS_PER_SOURCE

    stmt = (
        pg_insert(DiscoveryPreviewCache)
        .values(
            loop_id=loop_id,
            source_id=source_id,
            search_scope=search_scope,
            page=page,
            items_json=items_json,
            warnings_json=list(result.warnings),
            has_more=has_more,
            fetched_at=now,
            expires_at=expires_at,
            created_at=now,
            updated_at=now,
        )
        .on_conflict_do_update(
            constraint="uq_discovery_preview_cache_key",
            set_={
                "items_json": items_json,
                "warnings_json": list(result.warnings),
                "has_more": has_more,
                "fetched_at": now,
                "expires_at": expires_at,
                "updated_at": now,
            },
        )
    )
    await db.execute(stmt)
    await db.commit()
    logger.debug(
        "Cache upserted: loop=%s source=%s scope=%s page=%s ttl=%ds",
        loop_id,
        source_id,
        search_scope,
        page,
        ttl_seconds,
    )


async def invalidate_for_loop(db: AsyncSession, *, loop_id: UUID) -> int:
    stmt = delete(DiscoveryPreviewCache).where(
        DiscoveryPreviewCache.loop_id == loop_id
    )
    result = await db.execute(stmt)
    await db.commit()
    deleted = result.rowcount
    if deleted:
        logger.debug("Cache invalidated: loop=%s rows=%d", loop_id, deleted)
    return deleted


async def cleanup_expired(db: AsyncSession, *, now: datetime) -> int:
    stmt = delete(DiscoveryPreviewCache).where(
        DiscoveryPreviewCache.expires_at <= now
    )
    result = await db.execute(stmt)
    await db.commit()
    return result.rowcount


async def cleanup_stale(
    db: AsyncSession,
    *,
    now: datetime,
    max_age_days: int = RETENTION_DAYS,
) -> int:
    """Purge preview-cache rows not refreshed within ``max_age_days``.

    Keyed on ``fetched_at`` (bumped on every warm) so actively used loops are
    never purged; only stale/paused loops drop off. Only the cache table is
    affected — saved applications and vacancy matches live elsewhere.
    """
    cutoff = now - timedelta(days=max_age_days)
    stmt = delete(DiscoveryPreviewCache).where(
        DiscoveryPreviewCache.fetched_at < cutoff
    )
    result = await db.execute(stmt)
    await db.commit()
    deleted = result.rowcount
    if deleted:
        logger.info(
            "Cache retention: purged %d row(s) older than %dd", deleted, max_age_days
        )
    return deleted


def result_from_cache(entry: DiscoveryPreviewCache) -> DiscoveryAdapterResult:
    items = [DiscoveryAdapterItem(**item_data) for item_data in entry.items_json]
    return DiscoveryAdapterResult(
        source_id=entry.source_id,
        status="completed",
        items=items,
        warnings=list(entry.warnings_json),
    )
