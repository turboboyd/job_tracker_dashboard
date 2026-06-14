from __future__ import annotations

import logging
import re
from datetime import datetime, timezone
from uuid import UUID, uuid4

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.discovery_run_record import DiscoveryRunRecord
from app.db.models.loop import Loop
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
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
    DiscoveryRunPreviewInsight,
    DiscoveryRunPreviewItem,
    DiscoveryRunRequest,
    DiscoveryRunResponse,
)
from app.modules.discovery_sources.registry import get_discovery_source
from app.modules.loops.service import InvalidLoopError, LoopsService
from app.modules.vacancy_matches.scoring import (
    ScoreInput,
    ScoreResult,
    apply_score,
    normalize_text,
    score_input_from_match,
    score_match,
)
from app.modules.vacancy_matches.service import (
    VacancyMatchPreviewValidationError,
    normalize_source_url,
    parse_posted_at,
    sanitize_raw_metadata,
)

logger = logging.getLogger(__name__)


def build_excluded_keyword_matchers(
    excluded_keywords: list[str] | None,
) -> list[re.Pattern[str]]:
    """Compile loop ``excluded_keywords`` into whole-word, case-insensitive matchers.

    Whole-word matching (``\\b``) is deliberate: excluding "java" must not drop
    "javascript", and excluding "qa" must not drop "quality". Unicode word
    boundaries cover German/Cyrillic titles since ``re`` treats ``str`` patterns
    as Unicode. Blank and duplicate keywords are ignored.
    """
    matchers: list[re.Pattern[str]] = []
    seen: set[str] = set()
    for raw in excluded_keywords or []:
        if not isinstance(raw, str):
            continue
        keyword = raw.strip()
        if not keyword:
            continue
        key = keyword.casefold()
        if key in seen:
            continue
        seen.add(key)
        matchers.append(
            re.compile(rf"\b{re.escape(keyword)}\b", re.IGNORECASE)
        )
    return matchers


def preview_matches_excluded(
    preview: DiscoveryRunPreviewItem,
    matchers: list[re.Pattern[str]],
) -> bool:
    """True if any excluded matcher hits the preview's title/company/snippet."""
    haystack = " ".join(
        part
        for part in (preview.title, preview.company, preview.snippet)
        if part
    )
    if not haystack:
        return False
    return any(matcher.search(haystack) for matcher in matchers)


# ── Preview scoring (unified with persisted-match scoring) ──────────────────
# Previews are scored by the SAME core as persisted matches
# (vacancy_matches/scoring.py), so the number shown on the discovery feed is
# exactly the score the row would carry if saved. The legacy 0–1 relevance
# heuristic (term-coverage weights) was removed in Stage 6c; the 0–1
# ``relevance`` value lives on only as a deprecated mirror (= score / 100) for
# the current frontend badge.
_INSIGHT_MIN_TERM_LENGTH = 2


def loop_insight_terms(loop: Loop) -> list[str]:
    """The loop terms reported in the preview insight: target-role words +
    keywords, trimmed, de-duplicated case-insensitively, short tokens dropped."""
    raw_terms: list[str] = []
    role = getattr(loop, "target_role", None)
    if isinstance(role, str):
        raw_terms.extend(role.split())
    for keyword in getattr(loop, "keywords", None) or []:
        if isinstance(keyword, str):
            raw_terms.append(keyword.strip())

    terms: list[str] = []
    seen: set[str] = set()
    for term in raw_terms:
        term = term.strip()
        if len(term) < _INSIGHT_MIN_TERM_LENGTH:
            continue
        key = term.casefold()
        if key in seen:
            continue
        seen.add(key)
        terms.append(term)
    return terms


def build_preview_insight(
    loop: Loop, result: ScoreResult
) -> DiscoveryRunPreviewInsight:
    """Matched / missing loop terms derived from the score result's coded
    reasons. ``score`` stays on the legacy 0–1 scale (= total / 100) because the
    current frontend clamps it to [0, 1] before rendering a percentage."""
    matched_normalized: set[str] = set()
    for reason in result.reasons:
        if reason.code in ("title_match", "keyword_matched"):
            for term in reason.terms:
                matched_normalized.add(normalize_text(term))

    matched: list[str] = []
    missing: list[str] = []
    for term in loop_insight_terms(loop):
        if normalize_text(term) in matched_normalized:
            matched.append(term)
        else:
            missing.append(term)
    return DiscoveryRunPreviewInsight(
        score=round(result.total / 100, 3), matched=matched, missing=missing
    )


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

            # Load every saved key for this loop ONCE, grouped by source,
            # instead of querying per source (the old N+1).
            handled_by_source = await self._load_handled_keys_by_source(loop.id)

            for source_id in selected_sources:
                item, source_checked = await self._evaluate_source(
                    loop,
                    source_id,
                    payload,
                    handled=handled_by_source.get(source_id, (set(), set())),
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

        created_by_loop: dict[str, int] = {}
        if self._db is not None and not payload.dry_run:
            # Auto-discovery pass: persist freshly-found vacancies as "new"
            # matches so they surface in the user's Matches list. Each step is
            # wrapped in its own SAVEPOINT so a failure can't poison the outer
            # request/scheduler transaction (mirrors the cache-write guard).
            try:
                async with self._db.begin_nested():
                    created_by_loop = await self._persist_matches(
                        user=user,
                        loops=loops,
                        items=items,
                    )
            except Exception:
                logger.warning(
                    "Failed to persist discovery matches (non-fatal)",
                    exc_info=True,
                )
                created_by_loop = {}

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
                        created_by_loop=created_by_loop,
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
            matches_created=sum(created_by_loop.values()),
            matches_previewed=matches_previewed,
            warnings=warnings,
            items=items,
        )

    async def _persist_matches(
        self,
        *,
        user: User,
        loops: list[Loop],
        items: list[DiscoveryRunItem],
    ) -> dict[str, int]:
        """Persist freshly-discovered previews as ``new`` vacancy matches.

        Only runs on a non-dry-run (auto-discovery) pass. By the time we get
        here ``item.preview_items`` has already been filtered against the loop's
        saved matches and excluded keywords (see
        ``_filter_already_handled`` / ``_filter_excluded_keywords``), so every
        surviving preview is genuinely new — cross-run dedupe is handled there.
        We still de-dupe *within* this batch (a source can return the same
        posting twice, or overlapping scopes can collide) by source+external_id
        and normalized URL. Returns the number of matches created per loop id.
        """
        created_by_loop: dict[str, int] = {}
        if self._db is None:
            return created_by_loop

        loops_by_id = {str(loop.id): loop for loop in loops}
        items_by_loop: dict[str, list[DiscoveryRunItem]] = {}
        for item in items:
            if item.loop_id in loops_by_id:
                items_by_loop.setdefault(item.loop_id, []).append(item)

        for loop_id, loop_items in items_by_loop.items():
            seen_external: set[tuple[str, str]] = set()
            seen_url: set[str] = set()
            created = 0
            for item in loop_items:
                if item.status != "would_run" or not item.source_id:
                    continue
                source_id = item.source_id
                for preview in item.preview_items:
                    try:
                        normalized_url = normalize_source_url(preview.source_url)
                    except VacancyMatchPreviewValidationError:
                        continue
                    external_id = (preview.external_id or "").strip() or None
                    if external_id is not None:
                        external_key = (source_id, external_id)
                        if external_key in seen_external:
                            continue
                        seen_external.add(external_key)
                    if normalized_url in seen_url:
                        continue
                    seen_url.add(normalized_url)

                    match = VacancyMatch(
                        user_id=user.id,
                        loop_id=loop_id,
                        source_url=normalized_url,
                        source=source_id,
                        external_id=external_id,
                        company_name=preview.company,
                        role_title=preview.title or "Вакансия из автопоиска",
                        location_text=preview.location,
                        vacancy_description=preview.snippet,
                        raw_metadata=sanitize_raw_metadata(
                            {
                                **(preview.raw_metadata or {}),
                                **(
                                    {"posted_at": preview.posted_at}
                                    if preview.posted_at
                                    else {}
                                ),
                            }
                        ),
                        confidence=preview.confidence,
                        warnings=[],
                        status="new",
                        posted_at=parse_posted_at(preview.posted_at),
                    )
                    apply_score(
                        match,
                        score_match(
                            loops_by_id[loop_id], score_input_from_match(match)
                        ),
                    )
                    self._db.add(match)
                    created += 1
            if created:
                created_by_loop[loop_id] = created

        await self._db.flush()
        return created_by_loop

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
        created_by_loop: dict[str, int] | None = None,
    ) -> None:
        if self._db is None or not loops:
            return

        created_by_loop = created_by_loop or {}

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
            # Prefer the actual persisted count (from _persist_matches) so the
            # history's "new" column reflects how many vacancies were really
            # written, not just how many previews were surfaced. Falls back to
            # the preview count when no persistence ran (dry-run/warm-only).
            loop_new = created_by_loop.get(str(loop.id), loop_found)
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
                items_new=loop_new,
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
        handled: tuple[set[str], set[str]],
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
                item = self._filter_excluded_keywords(item, loop)
                item = self._filter_already_handled(item, handled)
                item = self._rank_preview_items(item, loop)
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

        item = self._filter_excluded_keywords(item, loop)
        item = self._filter_already_handled(item, handled)
        item = self._rank_preview_items(item, loop)
        return item, 1

    @staticmethod
    def _rank_preview_items(item: DiscoveryRunItem, loop: Loop) -> DiscoveryRunItem:
        """Sort previews best-first by the unified match score and annotate them.

        Uses the same scoring core as persisted matches, so the preview number
        equals the score the row would carry once saved. Applied at read time
        (not stored in cache) so ranking always reflects the loop's current
        role/keywords/location. Sorting is stable: equal scores keep the
        original (adapter) order. Annotations per preview:
        - ``confidence["score"]``     — unified 0–100 score (new clients);
        - ``confidence["relevance"]`` — deprecated 0–1 mirror (= score / 100)
          kept for the current frontend badge until Stage 6d;
        - ``insight``                 — matched / missing loop terms (score on
          the 0–1 scale for the same frontend-compat reason).
        """
        if not item.preview_items:
            return item

        scored: list[tuple[int, int, DiscoveryRunPreviewItem]] = []
        for index, preview in enumerate(item.preview_items):
            result = score_match(
                loop,
                ScoreInput(
                    role_title=preview.title,
                    company_name=preview.company,
                    location_text=preview.location,
                    description=preview.snippet,
                    source=item.source_id,
                ),
            )
            mirror = round(result.total / 100, 3)
            annotated = preview.model_copy(
                update={
                    "confidence": {
                        **preview.confidence,
                        "score": float(result.total),
                        "relevance": mirror,
                    },
                    "insight": build_preview_insight(loop, result),
                }
            )
            scored.append((result.total, index, annotated))

        # Sort by score desc; original index keeps ties stable.
        scored.sort(key=lambda entry: (-entry[0], entry[1]))
        return item.model_copy(
            update={"preview_items": [preview for _, _, preview in scored]}
        )

    @staticmethod
    def _filter_excluded_keywords(
        item: DiscoveryRunItem, loop: Loop
    ) -> DiscoveryRunItem:
        """Drop preview items whose title/company/snippet match a loop minus-word.

        Applied in-memory (cheap) before the DB-backed already-handled filter so
        excluded vacancies never reach the user — regardless of which adapter
        produced them or whether they came from cache or a live fetch.
        """
        if not item.preview_items:
            return item

        matchers = build_excluded_keyword_matchers(
            getattr(loop, "excluded_keywords", None)
        )
        if not matchers:
            return item

        kept = [
            preview
            for preview in item.preview_items
            if not preview_matches_excluded(preview, matchers)
        ]
        if len(kept) == len(item.preview_items):
            return item

        return item.model_copy(
            update={"preview_items": kept, "items_previewed": len(kept)}
        )

    async def _load_handled_keys_by_source(
        self, loop_id: UUID
    ) -> dict[str, tuple[set[str], set[str]]]:
        """Load every saved key for a loop in one query, grouped by source.

        Returns ``{source_id: (external_ids, normalized_urls)}`` covering the
        loop's saved vacancy matches so the preview feed never re-offers them —
        including after a page reload, where the frontend's in-memory save state
        is lost. Loading all sources at once avoids the old N+1 (one query per
        source) when a loop spans several sources.
        """
        handled: dict[str, tuple[set[str], set[str]]] = {}
        if self._db is None:
            return handled

        loop_key = str(loop_id)

        match_rows = (
            await self._db.execute(
                select(
                    VacancyMatch.source,
                    VacancyMatch.external_id,
                    VacancyMatch.source_url,
                ).where(VacancyMatch.loop_id == loop_key)
            )
        ).all()

        for source_id, external_id, source_url in match_rows:
            if source_id is None:
                continue
            external_ids, urls = handled.setdefault(source_id, (set(), set()))
            if external_id and external_id.strip():
                external_ids.add(external_id.strip())
            if source_url:
                # Saved URLs are persisted already-normalized.
                urls.add(source_url)

        return handled

    @staticmethod
    def _filter_already_handled(
        item: DiscoveryRunItem, handled: tuple[set[str], set[str]]
    ) -> DiscoveryRunItem:
        if not item.preview_items:
            return item

        external_ids, urls = handled
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
            reason = "automatic_match_persistence"
            message = "Source adapter returned items; new matches are persisted."

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
