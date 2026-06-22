from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.modules.applications.repository import ApplicationsRepository
from app.modules.applications.schemas import ApplicationCreate
from app.modules.applications.service import ApplicationsService
from app.modules.discovery_sources.registry import get_discovery_source
from app.modules.loops.service import LoopsService
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse
from app.modules.vacancy_import.service import VacancyImportService
from app.modules.vacancy_matches.evaluation import evaluate_vacancy_match
from app.modules.vacancy_matches.repository import VacancyMatchesRepository
from app.modules.vacancy_matches.schemas import (
    CreateApplicationFromMatchRequest,
    VacancyMatchCreate,
    VacancyMatchEvaluationResponse,
    VacancyMatchFromPreviewRequest,
    VacancyMatchPatch,
)
from app.modules.vacancy_matches.scoring import (
    apply_score,
    score_input_from_match,
    score_match,
)


class VacancyMatchError(Exception):
    code = "VACANCY_MATCH_ERROR"
    status_code = 400

    def __init__(self, message: str | None = None) -> None:
        super().__init__(message or self.code)
        self.message = message or self.code


class VacancyMatchNotFoundError(VacancyMatchError):
    code = "VACANCY_MATCH_NOT_FOUND"
    status_code = 404


class VacancyMatchConvertValidationError(VacancyMatchError):
    code = "VACANCY_MATCH_CONVERT_INVALID"
    status_code = 422


class VacancyMatchPreviewValidationError(VacancyMatchError):
    code = "VACANCY_MATCH_PREVIEW_INVALID"
    status_code = 422


def normalize_source_url(url: str) -> str:
    parsed = urlsplit(url.strip())
    if parsed.scheme.lower() not in {"http", "https"} or not parsed.netloc:
        raise VacancyMatchPreviewValidationError("source_url must be a valid http(s) URL")

    scheme = parsed.scheme.lower()
    netloc = parsed.netloc.lower()
    path = parsed.path or "/"
    if path != "/":
        path = path.rstrip("/")

    query_pairs = parse_qsl(parsed.query, keep_blank_values=True)
    query = urlencode(sorted(query_pairs), doseq=True)
    return urlunsplit((scheme, netloc, path, query, ""))


def _sanitize_metadata_value(value: Any, *, depth: int = 0) -> Any:
    if depth >= 3:
        return None
    if value is None or isinstance(value, bool | int | float):
        return value
    if isinstance(value, str):
        return value[:500]
    if isinstance(value, list):
        return [
            _sanitize_metadata_value(item, depth=depth + 1)
            for item in value[:10]
        ]
    if isinstance(value, dict):
        return {
            str(key)[:80]: _sanitize_metadata_value(nested, depth=depth + 1)
            for key, nested in list(value.items())[:20]
            if isinstance(key, str | int | float | bool)
        }
    return str(value)[:200]


def sanitize_raw_metadata(raw_metadata: dict) -> dict:
    sanitized = _sanitize_metadata_value(raw_metadata)
    return sanitized if isinstance(sanitized, dict) else {}


def _normalize_source(value: str | None) -> str:
    """Lowercase + trim a source id for case-insensitive comparison."""
    return (value or "").strip().lower()


def parse_posted_at(value: str | None) -> datetime | None:
    """Best-effort parse of a source's free-form ``posted_at`` into a datetime.

    Returns a timezone-aware UTC datetime for ISO-8601-ish inputs (the common
    case across adapters), or ``None`` for relative/unparseable strings. Callers
    store ``None`` and fall back to ``created_at`` for the freshness sort.
    """
    if not value:
        return None
    text = value.strip()
    if not text:
        return None
    candidate = text[:-1] + "+00:00" if text.endswith("Z") else text
    try:
        parsed = datetime.fromisoformat(candidate)
    except ValueError:
        return None
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)
    return parsed.astimezone(UTC)


class VacancyMatchesService:
    def __init__(
        self,
        db: AsyncSession,
        import_service: VacancyImportService | None = None,
    ) -> None:
        self._db = db
        self._repo = VacancyMatchesRepository(db)
        self._apps = ApplicationsService(db)
        self._apps_repo = ApplicationsRepository(db)
        self._import = import_service or VacancyImportService()
        self._loops = LoopsService(db)

    async def import_preview(
        self,
        user: User,
        loop_id: str,
        url: str,
    ) -> VacancyImportPreviewResponse:
        await self._loops.require_owned_active(user, loop_id)
        return await self._import.preview(url)

    async def create(
        self,
        user: User,
        loop_id: str,
        payload: VacancyMatchCreate,
    ) -> VacancyMatch:
        loop = await self._loops.require_owned_active(user, loop_id)
        data = payload.model_dump()
        match = VacancyMatch(user_id=user.id, loop_id=loop_id, **data)
        apply_score(match, score_match(loop, score_input_from_match(match)))
        return await self._repo.create(match)

    async def create_from_preview(
        self,
        user: User,
        loop_id: str,
        payload: VacancyMatchFromPreviewRequest,
    ) -> tuple[VacancyMatch, bool]:
        loop = await self._loops.require_owned_active(user, loop_id)

        source = get_discovery_source(payload.source_id)
        if source is None:
            raise VacancyMatchPreviewValidationError("source_id is not registered")
        if not source.enabled:
            raise VacancyMatchPreviewValidationError("source_id is disabled")

        normalized_url = normalize_source_url(payload.source_url)
        external_id = payload.external_id.strip() if payload.external_id else None

        if external_id:
            existing = await self._repo.get_by_source_external_id(
                user_id=user.id,
                loop_id=loop_id,
                source=payload.source_id,
                external_id=external_id,
            )
            if existing is not None:
                return existing, False

        source_matches = await self._repo.list_for_source(
            user_id=user.id,
            loop_id=loop_id,
            source=payload.source_id,
        )
        for existing in source_matches:
            try:
                existing_url = normalize_source_url(existing.source_url)
            except VacancyMatchPreviewValidationError:
                existing_url = existing.source_url
            if existing_url == normalized_url:
                return existing, False

        match = VacancyMatch(
            user_id=user.id,
            loop_id=loop_id,
            source_url=normalized_url,
            source=payload.source_id,
            external_id=external_id,
            company_name=payload.company,
            role_title=payload.title or "Vacancy from discovery preview",
            location_text=payload.location,
            vacancy_description=payload.description,
            raw_metadata=sanitize_raw_metadata(
                {
                    **payload.raw_metadata,
                    **({"posted_at": payload.posted_at} if payload.posted_at else {}),
                }
            ),
            confidence=payload.confidence,
            warnings=[],
            status="saved",
            posted_at=parse_posted_at(payload.posted_at),
        )
        apply_score(match, score_match(loop, score_input_from_match(match)))
        return await self._repo.create(match), True

    async def save_preview_as_application(
        self,
        user: User,
        loop_id: str,
        payload: VacancyMatchFromPreviewRequest,
    ) -> tuple[Application, VacancyMatch | None, bool, bool]:
        loop = await self._loops.require_owned_active(user, loop_id)

        source = get_discovery_source(payload.source_id)
        if source is None:
            raise VacancyMatchPreviewValidationError("source_id is not registered")
        if not source.enabled:
            raise VacancyMatchPreviewValidationError("source_id is disabled")

        normalized_url = normalize_source_url(payload.source_url)
        external_id = payload.external_id.strip() if payload.external_id else None

        # Dedup level 1: source + external_id
        if external_id:
            existing_match = await self._repo.get_by_source_external_id(
                user_id=user.id,
                loop_id=loop_id,
                source=payload.source_id,
                external_id=external_id,
            )
            if existing_match is not None:
                if existing_match.application_id is not None:
                    existing_app = await self._apps_repo.get_by_id(existing_match.application_id)
                    if existing_app is not None and existing_app.user_id == user.id:
                        return existing_app, existing_match, False, True
                app = await self._make_application(user, loop_id, payload, normalized_url)
                match = await self._repo.patch(
                    existing_match, {"status": "converted", "application_id": app.id}
                )
                return app, match, True, False

        # Dedup level 2: normalized source_url
        source_matches = await self._repo.list_for_source(
            user_id=user.id,
            loop_id=loop_id,
            source=payload.source_id,
        )
        for existing_match in source_matches:
            try:
                existing_normalized = normalize_source_url(existing_match.source_url)
            except VacancyMatchPreviewValidationError:
                existing_normalized = existing_match.source_url
            if existing_normalized == normalized_url:
                if existing_match.application_id is not None:
                    existing_app = await self._apps_repo.get_by_id(existing_match.application_id)
                    if existing_app is not None and existing_app.user_id == user.id:
                        return existing_app, existing_match, False, True
                app = await self._make_application(user, loop_id, payload, normalized_url)
                match = await self._repo.patch(
                    existing_match, {"status": "converted", "application_id": app.id}
                )
                return app, match, True, False

        # No duplicate — create application and link a new match
        app = await self._make_application(user, loop_id, payload, normalized_url)
        match = VacancyMatch(
            user_id=user.id,
            loop_id=loop_id,
            source_url=normalized_url,
            source=payload.source_id,
            external_id=external_id,
            company_name=payload.company,
            role_title=payload.title or "Вакансия из предварительного просмотра",
            location_text=payload.location,
            vacancy_description=payload.description,
            raw_metadata=sanitize_raw_metadata(
                {
                    **payload.raw_metadata,
                    **({"posted_at": payload.posted_at} if payload.posted_at else {}),
                }
            ),
            confidence=payload.confidence,
            warnings=[],
            status="converted",
            application_id=app.id,
            posted_at=parse_posted_at(payload.posted_at),
        )
        apply_score(match, score_match(loop, score_input_from_match(match)))
        return app, await self._repo.create(match), True, False

    async def _make_application(
        self,
        user: User,
        loop_id: str,
        payload: VacancyMatchFromPreviewRequest,
        normalized_url: str,
    ) -> Application:
        return await self._apps.create(
            user,
            ApplicationCreate(
                company_name=payload.company or "Компания не указана",
                role_title=payload.title or "Вакансия из предварительного просмотра",
                location_text=payload.location,
                vacancy_url=normalized_url,
                source=payload.source_id,
                vacancy_description=payload.description,
                loop_id=loop_id,
                has_loop=True,
                status="SAVED",
            ),
        )

    async def list_for_loop(
        self,
        user: User,
        loop_id: str,
        *,
        status: str | None = None,
        sort: str = "freshness",
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[VacancyMatch], int]:
        await self._loops.require_owned_for_read(user, loop_id)
        return await self._repo.list_for_loop(
            user_id=user.id,
            loop_id=loop_id,
            status=status,
            sort=sort,
            limit=limit,
            offset=offset,
        )

    async def list_feed(
        self,
        user: User,
        *,
        tab: str = "all",
        q: str | None = None,
        source: str | None = None,
        sort: str = "posted",
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[tuple[VacancyMatch, str | None]], dict[str, int]]:
        """Cross-loop matches feed restricted to the user's active loops.

        A loop contributes to the feed only when it is **not paused/archived**
        AND **has at least one selected source**. A loop with no selected sources
        searches nothing (the user cleared its sources), so it must not surface
        stale matches from a previous configuration — mirroring the scheduler,
        which skips such loops. Each contributing loop scopes its matches to its
        current source allow-list. Returns matches paired with their loop's
        display name, plus {all,new,saved} counts. This is a view filter only:
        no rows are deleted, and a loop's matches remain on its own Loop page.
        """
        loops, _ = await self._loops.list_for_user(
            user, include_archived=False, limit=500, offset=0
        )
        visible = [loop for loop in loops if loop.status not in ("paused", "archived")]

        loop_source_filters: list[tuple[str, list[str]]] = []
        loop_rank: dict[str, int] = {}
        name_by_id: dict[str, str] = {}
        ranked = sorted(visible, key=lambda loop: (loop.title or "").lower())
        rank = 0
        for loop in ranked:
            allowed = [
                normalized
                for raw in (loop.selected_sources or [])
                if (normalized := _normalize_source(raw))
            ]
            # No currently-selected sources → contributes no matches.
            if not allowed:
                continue
            loop_id_str = str(loop.id)
            loop_source_filters.append((loop_id_str, allowed))
            loop_rank[loop_id_str] = rank
            name_by_id[loop_id_str] = loop.title
            rank += 1

        q_norm = q.strip() if q else None
        source_norm = _normalize_source(source) if source else None

        matches, counts = await self._repo.list_feed(
            user_id=user.id,
            loop_source_filters=loop_source_filters,
            loop_rank=loop_rank,
            tab=tab,
            q=q_norm or None,
            source=source_norm or None,
            sort=sort,
            limit=limit,
            offset=offset,
        )
        items = [(match, name_by_id.get(match.loop_id)) for match in matches]
        return items, counts

    async def get_owned_in_loop(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatch:
        match = await self._repo.get_owned_in_loop(
            user_id=user.id,
            loop_id=loop_id,
            match_id=match_id,
        )
        if match is None:
            raise VacancyMatchNotFoundError("Vacancy match not found")
        return match

    async def mark_seen(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatch:
        """Record that the user viewed this match (idempotent).

        Uses read-level ownership so a match stays markable even when its loop
        is paused/archived. The first view wins; later calls are no-ops.
        """
        await self._loops.require_owned_for_read(user, loop_id)
        match = await self.get_owned_in_loop(user, loop_id, match_id)
        return await self._repo.mark_seen(match)

    async def patch(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
        payload: VacancyMatchPatch,
    ) -> VacancyMatch:
        await self._loops.require_owned_active(user, loop_id)
        match = await self.get_owned_in_loop(user, loop_id, match_id)
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return match
        return await self._repo.patch(match, updates)

    async def evaluate(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatchEvaluationResponse:
        loop = await self._loops.require_owned_for_read(user, loop_id)
        match = await self.get_owned_in_loop(user, loop_id, match_id)
        existing_matches, _ = await self._repo.list_for_loop(
            user_id=user.id,
            loop_id=loop_id,
            limit=100,
            offset=0,
        )
        applications, _ = await self._apps_repo.list_for_user(
            user.id,
            archived=False,
            limit=100,
            offset=0,
        )
        return evaluate_vacancy_match(
            match=match,
            loop=loop,
            existing_matches=existing_matches,
            applications=applications,
        )

    async def convert_to_application(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
    ) -> tuple[Application, VacancyMatch]:
        app, match, _, _ = await self.create_application_from_match(
            user,
            loop_id,
            match_id,
            CreateApplicationFromMatchRequest(),
        )
        return app, match

    async def create_application_from_match(
        self,
        user: User,
        loop_id: str,
        match_id: UUID,
        payload: CreateApplicationFromMatchRequest,
    ) -> tuple[Application, VacancyMatch, bool, bool]:
        await self._loops.require_owned_active(user, loop_id)
        match = await self.get_owned_in_loop(user, loop_id, match_id)

        if match.status == "converted" and match.application_id is not None:
            existing = await self._apps_repo.get_by_id(match.application_id)
            if existing is not None and existing.user_id == user.id:
                return existing, match, False, True

        if not match.company_name or not match.role_title:
            raise VacancyMatchConvertValidationError(
                "company_name and role_title are required for conversion"
            )

        app = await self._apps.create(
            user,
            ApplicationCreate(
                company_name=match.company_name,
                role_title=match.role_title,
                location_text=match.location_text,
                vacancy_url=match.source_url,
                source=match.source,
                vacancy_description=match.vacancy_description,
                loop_id=match.loop_id,
                has_loop=True,
                status=payload.status,
                is_favorite=payload.favorite,
                current_note=payload.notes,
            ),
        )
        updated = await self._repo.patch(
            match,
            {
                "status": "converted",
                "application_id": app.id,
            },
        )
        return app, updated, True, False
