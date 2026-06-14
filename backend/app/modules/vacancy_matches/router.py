from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.applications.schemas import ApplicationRead
from app.modules.vacancy_import.schemas import (
    VacancyImportPreviewRequest,
    VacancyImportPreviewResponse,
)
from app.modules.vacancy_import.service import VacancyImportService, get_vacancy_import_service
from app.modules.vacancy_matches.schemas import (
    ApplicationFromPreviewResponse,
    ConvertMatchResponse,
    CreateApplicationFromMatchRequest,
    CreateApplicationFromMatchResponse,
    LoopMatchesSort,
    MatchesFeedCounts,
    MatchesFeedItem,
    MatchesFeedResponse,
    MatchesFeedSort,
    MatchesFeedTab,
    VacancyMatchCreate,
    VacancyMatchEvaluationResponse,
    VacancyMatchFromPreviewRequest,
    VacancyMatchFromPreviewResponse,
    VacancyMatchListResponse,
    VacancyMatchPatch,
    VacancyMatchRead,
    VacancyMatchStatus,
)
from app.modules.vacancy_matches.service import VacancyMatchError, VacancyMatchesService

router = APIRouter(prefix="/loops/{loop_id}/matches", tags=["vacancy-matches"])


def _match_http_error(error: VacancyMatchError) -> HTTPException:
    return HTTPException(
        status_code=error.status_code,
        detail={"code": error.code, "message": error.message},
    )


def get_vacancy_matches_service(
    db: DbSession,
    import_service: VacancyImportService = Depends(get_vacancy_import_service),
) -> VacancyMatchesService:
    return VacancyMatchesService(db, import_service)


VacancyMatchesSvc = Annotated[VacancyMatchesService, Depends(get_vacancy_matches_service)]


@router.post(
    "/import-preview",
    response_model=VacancyImportPreviewResponse,
    summary="Preview one vacancy URL for a loop without saving it",
)
async def import_match_preview(
    loop_id: str,
    payload: VacancyImportPreviewRequest,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyImportPreviewResponse:
    return await svc.import_preview(current_user, loop_id, payload.url)


@router.post(
    "",
    response_model=VacancyMatchRead,
    status_code=status.HTTP_201_CREATED,
    summary="Save vacancy preview as a match under a loop",
)
async def create_match(
    loop_id: str,
    payload: VacancyMatchCreate,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchRead:
    match = await svc.create(current_user, loop_id, payload)
    return VacancyMatchRead.model_validate(match)


@router.post(
    "/from-preview",
    response_model=VacancyMatchFromPreviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save one selected discovery preview item as a vacancy match",
)
async def create_match_from_preview(
    loop_id: str,
    payload: VacancyMatchFromPreviewRequest,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchFromPreviewResponse:
    try:
        match, created = await svc.create_from_preview(current_user, loop_id, payload)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return VacancyMatchFromPreviewResponse(
        match=VacancyMatchRead.model_validate(match),
        created=created,
        duplicate=not created,
    )


@router.get("", response_model=VacancyMatchListResponse, summary="List vacancy matches for a loop")
async def list_matches(
    loop_id: str,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
    status_filter: VacancyMatchStatus | None = Query(default=None, alias="status"),
    sort: LoopMatchesSort = Query(default="freshness"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> VacancyMatchListResponse:
    items, total = await svc.list_for_loop(
        current_user,
        loop_id,
        status=status_filter,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return VacancyMatchListResponse(
        items=[VacancyMatchRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{match_id}",
    response_model=VacancyMatchRead,
    summary="Get one vacancy match for a loop",
)
async def get_match(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchRead:
    try:
        match = await svc.get_owned_in_loop(current_user, loop_id, match_id)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return VacancyMatchRead.model_validate(match)


@router.post(
    "/{match_id}/seen",
    response_model=VacancyMatchRead,
    summary="Mark one vacancy match as seen by the current user",
)
async def mark_match_seen(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchRead:
    """Stamp ``seen_at`` the first time the user opens this match.

    Idempotent: repeated calls keep the original view timestamp. Drives the
    per-match "Просмотрено" badge and the "Новые" (unseen) tab.
    """
    try:
        match = await svc.mark_seen(current_user, loop_id, match_id)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return VacancyMatchRead.model_validate(match)


@router.patch(
    "/{match_id}",
    response_model=VacancyMatchRead,
    summary="Update editable vacancy match fields",
)
async def patch_match(
    loop_id: str,
    match_id: UUID,
    payload: VacancyMatchPatch,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchRead:
    try:
        match = await svc.patch(current_user, loop_id, match_id, payload)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return VacancyMatchRead.model_validate(match)


@router.post(
    "/{match_id}/evaluate",
    response_model=VacancyMatchEvaluationResponse,
    summary="Evaluate deterministic score and duplicate metadata for a vacancy match",
)
async def evaluate_match(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyMatchEvaluationResponse:
    try:
        return await svc.evaluate(current_user, loop_id, match_id)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error


@router.post(
    "/{match_id}/create-application",
    response_model=CreateApplicationFromMatchResponse,
    summary="Create an application from a saved vacancy match",
)
async def create_application_from_match(
    loop_id: str,
    match_id: UUID,
    payload: CreateApplicationFromMatchRequest,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> CreateApplicationFromMatchResponse:
    try:
        app, match, created, already_linked = await svc.create_application_from_match(
            current_user,
            loop_id,
            match_id,
            payload,
        )
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return CreateApplicationFromMatchResponse(
        application=ApplicationRead.model_validate(app),
        match=VacancyMatchRead.model_validate(match),
        created=created,
        already_linked=already_linked,
    )


@router.post(
    "/{match_id}/convert-to-application",
    response_model=ConvertMatchResponse,
    summary="Create an application from a saved vacancy match",
)
async def convert_match_to_application(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> ConvertMatchResponse:
    try:
        app, match = await svc.convert_to_application(current_user, loop_id, match_id)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return ConvertMatchResponse(
        application_id=app.id,
        match=VacancyMatchRead.model_validate(match),
    )


loop_applications_router = APIRouter(
    prefix="/loops/{loop_id}/applications",
    tags=["loop-applications"],
)


@loop_applications_router.post(
    "/from-preview",
    response_model=ApplicationFromPreviewResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Save a discovery preview item directly as an Application with status Saved",
)
async def save_preview_as_application(
    loop_id: str,
    payload: VacancyMatchFromPreviewRequest,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> ApplicationFromPreviewResponse:
    try:
        app, match, created, duplicate = await svc.save_preview_as_application(
            current_user, loop_id, payload
        )
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return ApplicationFromPreviewResponse(
        application=ApplicationRead.model_validate(app),
        match_id=match.id if match is not None else None,
        application_id=app.id,
        created=created,
        duplicate=duplicate,
    )


matches_feed_router = APIRouter(prefix="/matches", tags=["matches-feed"])


@matches_feed_router.get(
    "",
    response_model=MatchesFeedResponse,
    summary="Paginated cross-loop feed of saved vacancy matches",
)
async def list_matches_feed(
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
    tab: MatchesFeedTab = Query(default="all"),
    q: str | None = Query(default=None, max_length=200),
    source: str | None = Query(default=None, max_length=64),
    sort: MatchesFeedSort = Query(default="posted"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> MatchesFeedResponse:
    """List persisted matches across all of the user's visible loops.

    - ``tab``: ``all`` | ``new`` (unseen and not saved/applied) | ``saved``.
    - ``source``: restrict to one source id (case-insensitive).
    - ``q``: substring match over company / role / location.
    - ``sort``: ``posted`` (freshest, default) | ``company`` | ``loop`` |
      ``score`` (persisted match score, best first, unscored rows last).
    Counts for every tab are returned alongside the current page.
    """
    items, counts = await svc.list_feed(
        current_user,
        tab=tab,
        q=q,
        source=source,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    feed_items = [
        MatchesFeedItem(
            **VacancyMatchRead.model_validate(match).model_dump(),
            loop_name=loop_name,
        )
        for match, loop_name in items
    ]
    counts_model = MatchesFeedCounts(**counts)
    total = getattr(counts_model, tab)
    return MatchesFeedResponse(
        items=feed_items,
        total=total,
        limit=limit,
        offset=offset,
        counts=counts_model,
    )
