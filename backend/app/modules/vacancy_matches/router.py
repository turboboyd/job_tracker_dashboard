from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status

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
    VacancyMatchCreate,
    VacancyMatchEvaluationResponse,
    VacancyMatchFromPreviewRequest,
    VacancyMatchFromPreviewResponse,
    VacancyMatchListResponse,
    VacancyMatchPatch,
    VacancyMatchRead,
    VacancyMatchStatus,
    VacancyPreviewIgnoreListResponse,
    VacancyPreviewIgnoreRead,
    VacancyPreviewIgnoreRequest,
    VacancyPreviewIgnoreResponse,
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


@router.post(
    "/preview-ignores",
    response_model=VacancyPreviewIgnoreResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Hide one discovery preview item from future preview feeds",
)
async def create_preview_ignore(
    loop_id: str,
    payload: VacancyPreviewIgnoreRequest,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> VacancyPreviewIgnoreResponse:
    try:
        item, created = await svc.create_preview_ignore(current_user, loop_id, payload)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return VacancyPreviewIgnoreResponse(
        item=VacancyPreviewIgnoreRead.model_validate(item),
        created=created,
        duplicate=not created,
    )


@router.get(
    "/preview-ignores",
    response_model=VacancyPreviewIgnoreListResponse,
    summary="List preview items hidden by the current user for a loop",
)
async def list_preview_ignores(
    loop_id: str,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
    limit: int = Query(default=200, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
) -> VacancyPreviewIgnoreListResponse:
    items, total = await svc.list_preview_ignores_for_loop(
        current_user,
        loop_id,
        limit=limit,
        offset=offset,
    )
    return VacancyPreviewIgnoreListResponse(
        items=[VacancyPreviewIgnoreRead.model_validate(item) for item in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.delete(
    "/preview-ignores/{ignore_id}",
    summary="Remove one hidden discovery preview item",
)
async def delete_preview_ignore(
    loop_id: str,
    ignore_id: UUID,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
) -> Response:
    try:
        await svc.delete_preview_ignore(current_user, loop_id, ignore_id)
    except VacancyMatchError as error:
        raise _match_http_error(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("", response_model=VacancyMatchListResponse, summary="List vacancy matches for a loop")
async def list_matches(
    loop_id: str,
    current_user: CurrentUser,
    svc: VacancyMatchesSvc,
    status_filter: VacancyMatchStatus | None = Query(default=None, alias="status"),
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> VacancyMatchListResponse:
    items, total = await svc.list_for_loop(
        current_user,
        loop_id,
        status=status_filter,
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
