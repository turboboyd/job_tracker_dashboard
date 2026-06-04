from __future__ import annotations

import logging
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.discovery_run_record import DiscoveryRunRecord
from app.db.models.loop import Loop
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.db.models.vacancy_preview_ignore import VacancyPreviewIgnore
from app.modules.discovery_adapters.base import DiscoveryAdapterError
from app.modules.discovery_adapters.registry import (
    DiscoveryAdapterRegistry,
    get_discovery_adapter_registry,
)
from app.modules.discovery_adapters.safety import (
    MAX_RESULTS_PER_SOURCE,
    REQUEST_TIMEOUT_SECONDS,
    limit_preview_items,
)
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_runs.cache_repository import (
    get_fresh_cache,
    result_from_cache,
    upsert_cache,
)
from app.modules.discovery_runs.schemas import (
    DiscoveryRunHistoryItem,
    DiscoveryRunHistoryResponse,
    DiscoveryRunItem,
    DiscoveryRunPreviewItem,
    DiscoveryRunRequest,
    DiscoveryRunResponse,
)
from app.modules.discovery_sources.registry import get_discovery_source
from app.modules.loops.service import InvalidLoopError, LoopsService
from app.modules.vacancy_matches.service import (
    VacancyMatchPreviewValidationError,
    normalize_source_url,
)

logger = logging.getLogger(__name__)


class DiscoveryRunsService:
    def __init__(
        self,
        loops: LoopsService,
        adapter_registry: DiscoveryAdapterRegistry | None = None,
        db: AsyncSession | None = None,
    ) -> None:
        self._loops = loops
        self._adapter_registry = adapter_registry or get_discovery_adapter_registry()
        self._db = db

    async def run(
        self,
        user: User,
        payload: DiscoveryRunRequest,
    ) -> DiscoveryRunResponse:
        started_at = datetime.now(timezone.utc)
        loops = await self._load_loops(user, payload.loop_id)
        items: list[DiscoveryRunItem] = []
        warnings: list[str] = []
        sources_checked = 0
        matches_previewed = 0

        for loop in loops:
            loop_id = str(loop.id)
            if loop.status != "active":
                items.append(
                    DiscoveryRunItem(
                        loop_id=loop_id,
                        status="skipped",
                        reason="loop_not_eligible",
                        message="Loop is not active.",
                    )
                )
                warnings.append(f"Loop {loop_id} is not active.")
                continue

            selected_sources = self._source_ids_for_loop(loop, payload.source_ids)
            if not selected_sources:
                items.append(
                    DiscoveryRunItem(
                        loop_id=loop_id,
                        status="skipped",
                        reason="no_sources_selected",
                        message="No discovery sources selected for this Loop.",
                    )
                )
                warnings.append(f"Loop {loop_id} has no discovery sources selected.")
                continue

            for source_id in selected_sources:
                item, source_checked = await self._evaluate_source(
                    loop,
                    source_id,
                    payload,
                )
                sources_checked += source_checked
                matches_previewed += item.items_previewed
                items.append(item)
                if item.status != "would_run":
                    warnings.append(f"{loop_id}:{source_id}:{item.reason}")
                warnings.extend(
                    f"{loop_id}:{source_id}:{warning}" for warning in item.warnings
                )

        run_id = str(uuid4())
        finished_at = datetime.now(timezone.utc)
        overall_status: str = "completed_with_warnings" if warnings else "completed"
        if loops and all(it.status == "failed" for it in items):
            overall_status = "failed"

        if self._db is not None and not payload.dry_run:
            try:
                async with self._db.begin_nested():
                    await self._persist_history(
                        user=user,
                        loops=loops,
                        items=items,
                        run_id=run_id,
                        overall_status=overall_status,
                        matches_previewed=matches_previewed,
                        started_at=started_at,
                        finished_at=finished_at,
                    )
            except Exception:
                logger.warning(
                    "Failed to persist discovery run history (non-fatal)",
                    exc_info=True,
                )

        return DiscoveryRunResponse(
            run_id=run_id,
            status=overall_status,  # type: ignore[arg-type]
            dry_run=payload.dry_run,
            page=payload.page,
            page_size=payload.page_size,
            loops_checked=len(loops),
            sources_checked=sources_checked,
            matches_created=0,
            matches_previewed=matches_previewed,
            warnings=warnings,
            items=items,
        )

    async def _persist_history(
        self,
        *,
        user: User,
        loops: list[Loop],
        items: list[DiscoveryRunItem],
        run_id: str,
        overall_status: str,
        matches_previewed: int,
        started_at: datetime,
        finished_at: datetime,
    ) -> None:
        if self._db is None or not loops:
            return

        duration_ms = max(
            0, int((finished_at - started_at).total_seconds() * 1000)
        )
        items_by_loop: dict[str, list[DiscoveryRunItem]] = {}
        for it in items:
            items_by_loop.setdefault(it.loop_id, []).append(it)

        for loop in loops:
            loop_items = items_by_loop.get(str(loop.id), [])
            loop_sources = sorted(
                {it.source_id for it in loop_items if it.source_id is not None}
            )
            loop_found = sum(it.items_previewed for it in loop_items)
            loop_failed = [it for it in loop_items if it.status == "failed"]
            status = overall_status
            error_text: str | None = None
            if loop_failed:
                status = "failed" if len(loop_failed) == len(loop_items) else "completed_with_warnings"
                error_text = "; ".join(
                    f"{it.source_id or '?'}: {it.message}" for it in loop_failed
                )[:2000]

            record = DiscoveryRunRecord(
                user_id=user.id,
                loop_id=loop.id,
                run_id=run_id,
                status=status,
                sources=loop_sources,
                items_found=loop_found,
                items_new=loop_found,  # currently no dedupe — adapt later when match dedup ships
                duration_ms=duration_ms,
                error_text=error_text,
                started_at=started_at,
                finished_at=finished_at,
            )
            self._db.add(record)

            # NOTE: next_run_at is owned by the scheduler (app/scheduler.py),
            # which reschedules each loop after warming. We intentionally do not
            # touch it here so there is a single source of truth.

        try:
            await self._db.flush()
        except Exception:
            logger.warning("Failed to persist discovery run history", exc_info=True)

    async def list_history(
        self,
        user: User,
        loop_id: str | None,
        *,
        limit: int = 50,
        offset: int = 0,
    ) -> DiscoveryRunHistoryResponse:
        if self._db is None:
            return DiscoveryRunHistoryResponse(items=[], total=0, limit=limit, offset=offset)

        conditions = [DiscoveryRunRecord.user_id == user.id]
        if loop_id is not None:
            try:
                parsed = UUID(loop_id)
            except ValueError as exc:
                raise InvalidLoopError("Loop id must be a valid UUID") from exc
            conditions.append(DiscoveryRunRecord.loop_id == parsed)

        count_query = (
            select(func.count()).select_from(DiscoveryRunRecord).where(*conditions)
        )
        total = (await self._db.execute(count_query)).scalar_one()

        result = await self._db.execute(
            select(DiscoveryRunRecord)
            .where(*conditions)
            .order_by(DiscoveryRunRecord.finished_at.desc())
            .limit(limit)
            .offset(offset)
        )
        rows = list(result.scalars().all())

        return DiscoveryRunHistoryResponse(
            items=[
                DiscoveryRunHistoryItem(
                    id=str(row.id),
                    run_id=row.run_id,
                    loop_id=str(row.loop_id),
                    status=row.status,  # type: ignore[arg-type]
                    sources=list(row.sources or []),
                    items_found=row.items_found,
                    items_new=row.items_new,
                    duration_ms=row.duration_ms,
                    error_text=row.error_text,
                    started_at=row.started_at,
                    finished_at=row.finished_at,
                )
                for row in rows
            ],
            total=total,
            limit=limit,
            offset=offset,
        )

    async def _load_loops(self, user: User, loop_id: str | None) -> list[Loop]:
        if loop_id is not None:
            try:
                parsed = UUID(loop_id)
            except ValueError as exc:
                raise InvalidLoopError("Loop id must be a valid UUID") from exc
            return [await self._loops.get_owned(user, parsed)]

        items, _total = await self._loops.list_for_user(
            user,
            include_archived=False,
            limit=100,
            offset=0,
        )
        return [
            loop
            for loop in items
            if loop.status == "active" and loop.auto_discovery_enabled
        ]

    @staticmethod
    def _source_ids_for_loop(
        loop: Loop,
        requested_source_ids: list[str] | None,
    ) -> list[str]:
        selected = [str(source_id) for source_id in (loop.selected_sources or [])]
        if requested_source_ids is None:
            return selected
        return requested_source_ids

    async def _evaluate_source(
        self,
        loop: Loop,
        source_id: str,
        payload: DiscoveryRunRequest,
    ) -> tuple[DiscoveryRunItem, int]:
        loop_id = str(loop.id)
        source = get_discovery_source(source_id)
        if source is None:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="skipped",
                    reason="source_not_found",
                    message="Discovery source is not registered.",
                ),
                0,
            )
        if not source.enabled:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="skipped",
                    reason="source_disabled",
                    message="Discovery source is disabled.",
                ),
                0,
            )
        if not source.capabilities.automatic_discovery:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="skipped",
                    reason="automatic_discovery_not_available",
                    message="Automatic discovery is not available for this source.",
                ),
                0,
            )

        adapter = self._adapter_registry.get_adapter(source_id)
        if adapter is None:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="unsupported",
                    reason="source_adapter_not_implemented",
                    message="Source is marked runnable, but no safe adapter is implemented.",
                ),
                0,
            )

        # ── Cache lookup ──────────────────────────────────────────────────────
        if self._db is not None:
            now = datetime.now(timezone.utc)
            cached = await get_fresh_cache(
                self._db,
                loop_id=loop.id,
                source_id=source_id,
                search_scope=payload.search_scope,
                page=payload.page,
                now=now,
            )
            if cached is not None:
                logger.debug(
                    "Cache HIT: loop=%s source=%s scope=%s page=%s expires=%s",
                    loop.id,
                    source_id,
                    payload.search_scope,
                    payload.page,
                    cached.expires_at,
                )
                result = result_from_cache(cached)
                item = self._item_from_adapter_result(
                    loop_id=loop_id,
                    result=result,
                    dry_run=payload.dry_run,
                    max_results=payload.page_size,
                )
                item = await self._filter_already_handled(item, loop.id, source_id)
                return item, 1
            logger.debug(
                "Cache MISS: loop=%s source=%s scope=%s page=%s",
                loop.id,
                source_id,
                payload.search_scope,
                payload.page,
            )

        # ── Cache-only mode: never fetch externally on a miss ─────────────────
        # The user-facing feed sets cache_only so browsing never blocks on (or
        # hammers) external job boards. The miss is surfaced as "cache_warming"
        # so the caller can trigger a background warm and the UI can retry.
        if payload.cache_only:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="skipped",
                    reason="cache_warming",
                    message="No cached results yet — a background refresh was requested.",
                ),
                1,
            )

        # ── Live adapter call ─────────────────────────────────────────────────
        try:
            result = await adapter.discover(
                loop=loop,
                source=source,
                options=DiscoveryAdapterOptions(
                    dry_run=payload.dry_run,
                    max_results=min(payload.page_size, MAX_RESULTS_PER_SOURCE),
                    timeout_seconds=REQUEST_TIMEOUT_SECONDS,
                    search_scope=payload.search_scope,
                    page=payload.page,
                    page_size=payload.page_size,
                ),
            )
        except DiscoveryAdapterError:
            return (
                DiscoveryRunItem(
                    loop_id=loop_id,
                    source_id=source_id,
                    status="failed",
                    reason="source_adapter_failed",
                    message="Source adapter failed safely.",
                    errors=["source_adapter_failed"],
                ),
                1,
            )

        item = self._item_from_adapter_result(
            loop_id=loop_id,
            result=result,
            dry_run=payload.dry_run,
            max_results=payload.page_size,
        )

        # ── Cache write (only on completed results) ───────────────────────────
        # Wrap in a SAVEPOINT so a cache-write failure doesn't poison the outer
        # transaction (e.g. blocking subsequent writes like run-history persistence).
        if self._db is not None and result.status == "completed":
            try:
                async with self._db.begin_nested():
                    await upsert_cache(
                        self._db,
                        loop_id=loop.id,
                        source_id=source_id,
                        search_scope=payload.search_scope,
                        page=payload.page,
                        result=result,
                        now=datetime.now(timezone.utc),
                    )
            except Exception:
                logger.warning(
                    "Cache write failed (non-fatal): loop=%s source=%s",
                    loop.id,
                    source_id,
                    exc_info=True,
                )

        item = await self._filter_already_handled(item, loop.id, source_id)
        return item, 1

    async def _load_handled_keys(
        self, loop_id: UUID, source_id: str
    ) -> tuple[set[str], set[str]]:
        """Return (external_ids, normalized_urls) the user already saved/ignored.

        Covers both saved vacancy matches and explicitly ignored previews for
        this loop+source so the preview feed never re-offers them — including
        after a page reload, where the frontend's in-memory save state is lost.
        """
        external_ids: set[str] = set()
        urls: set[str] = set()
        if self._db is None:
            return external_ids, urls

        loop_key = str(loop_id)

        match_rows = (
            await self._db.execute(
                select(VacancyMatch.external_id, VacancyMatch.source_url).where(
                    VacancyMatch.loop_id == loop_key,
                    VacancyMatch.source == source_id,
                )
            )
        ).all()
        ignore_rows = (
            await self._db.execute(
                select(
                    VacancyPreviewIgnore.external_id,
                    VacancyPreviewIgnore.source_url,
                ).where(
                    VacancyPreviewIgnore.loop_id == loop_key,
                    VacancyPreviewIgnore.source_id == source_id,
                )
            )
        ).all()

        for external_id, source_url in (*match_rows, *ignore_rows):
            if external_id and external_id.strip():
                external_ids.add(external_id.strip())
            if source_url:
                # Saved/ignored URLs are persisted already-normalized.
                urls.add(source_url)

        return external_ids, urls

    async def _filter_already_handled(
        self, item: DiscoveryRunItem, loop_id: UUID, source_id: str
    ) -> DiscoveryRunItem:
        if self._db is None or not item.preview_items:
            return item

        external_ids, urls = await self._load_handled_keys(loop_id, source_id)
        if not external_ids and not urls:
            return item

        kept: list[DiscoveryRunPreviewItem] = []
        for preview in item.preview_items:
            ext = (preview.external_id or "").strip()
            if ext and ext in external_ids:
                continue
            if preview.source_url:
                try:
                    normalized = normalize_source_url(preview.source_url)
                except VacancyMatchPreviewValidationError:
                    normalized = preview.source_url
                if normalized in urls:
                    continue
            kept.append(preview)

        if len(kept) == len(item.preview_items):
            return item

        return item.model_copy(
            update={"preview_items": kept, "items_previewed": len(kept)}
        )

    @staticmethod
    def _item_from_adapter_result(
        *,
        loop_id: str,
        result: DiscoveryAdapterResult,
        dry_run: bool,
        max_results: int,
    ) -> DiscoveryRunItem:
        limited_items = limit_preview_items(
            result.items,
            max_results=min(max_results, MAX_RESULTS_PER_SOURCE),
        )
        preview_items = [
            DiscoveryRunPreviewItem(**item.model_dump()) for item in limited_items
        ]
        status = "would_run"
        reason = "adapter_preview_ready"
        message = "Source adapter returned preview items. No records were created."
        warnings = list(result.warnings)

        if result.status == "failed":
            status = "failed"
            reason = "source_adapter_failed"
            message = "Source adapter failed safely."
        elif result.status == "skipped":
            status = "skipped"
            reason = result.warnings[0] if result.warnings else "source_adapter_skipped"
            message = "Source adapter skipped this source safely."
        elif not dry_run:
            reason = "automatic_match_persistence_not_enabled"
            message = "Automatic match persistence is not enabled."
            warnings.append("automatic_match_persistence_not_enabled")

        return DiscoveryRunItem(
            loop_id=loop_id,
            source_id=result.source_id,
            status=status,
            reason=reason,
            message=message,
            items_previewed=len(preview_items),
            has_more=len(preview_items) >= min(max_results, MAX_RESULTS_PER_SOURCE),
            preview_items=preview_items,
            warnings=warnings,
            errors=result.errors,
        )
