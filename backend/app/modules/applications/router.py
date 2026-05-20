from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.applications.schemas import (
    ApplicationCreate,
    ApplicationListResponse,
    ApplicationPatch,
    ApplicationRead,
    SortParam,
    StatusTransitionRequest,
)
from app.modules.applications.service import ApplicationsService

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=ApplicationListResponse, summary="List applications")
async def list_applications(
    current_user: CurrentUser,
    db: DbSession,
    archived: bool = Query(default=False, description="Include archived applications"),
    status: str | None = Query(
        default=None,
        description="Comma-separated ProcessStatus values (e.g. APPLIED,INTERVIEW_1)",
    ),
    stage: str | None = Query(
        default=None,
        description=(
            "Filter by stage "
            "(ACTIVE | INTERVIEW | OFFER | REJECTED | NO_RESPONSE | ARCHIVED)"
        ),
    ),
    search: str | None = Query(
        default=None,
        description=(
            "Case-insensitive substring search over company_name, "
            "role_title, location_text, source"
        ),
    ),
    loop_id: str | None = Query(default=None, description="Filter by loop id"),
    is_favorite: bool | None = Query(
        default=None,
        description="Filter favorite applications",
    ),
    limit: int = Query(default=20, ge=1, le=100, description="Items per page (1–100)"),
    offset: int = Query(default=0, ge=0, description="Number of items to skip"),
    sort: SortParam = Query(
        default="updated_at_desc",
        description="Sort order",
    ),
) -> ApplicationListResponse:
    statuses = [s.strip() for s in status.split(",")] if status else None
    svc = ApplicationsService(db)
    items, total = await svc.list_for_user(
        current_user,
        archived=archived,
        statuses=statuses,
        stage=stage,
        search=search,
        loop_id=loop_id,
        is_favorite=is_favorite,
        sort=sort,
        limit=limit,
        offset=offset,
    )
    return ApplicationListResponse(
        items=[ApplicationRead.model_validate(a) for a in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "",
    response_model=ApplicationRead,
    status_code=status.HTTP_201_CREATED,
    summary="Create application",
)
async def create_application(
    payload: ApplicationCreate,
    current_user: CurrentUser,
    db: DbSession,
) -> ApplicationRead:
    svc = ApplicationsService(db)
    app = await svc.create(current_user, payload)
    return ApplicationRead.model_validate(app)


@router.get("/{app_id}", response_model=ApplicationRead, summary="Get application")
async def get_application(
    app_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> ApplicationRead:
    svc = ApplicationsService(db)
    app = await svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    return ApplicationRead.model_validate(app)


@router.patch("/{app_id}", response_model=ApplicationRead, summary="Update application")
async def patch_application(
    app_id: UUID,
    payload: ApplicationPatch,
    current_user: CurrentUser,
    db: DbSession,
) -> ApplicationRead:
    svc = ApplicationsService(db)
    app = await svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    updated = await svc.patch(app, payload, current_user.id)
    return ApplicationRead.model_validate(updated)


@router.post(
    "/{app_id}/status",
    response_model=ApplicationRead,
    summary="Transition application status",
)
async def change_application_status(
    app_id: UUID,
    payload: StatusTransitionRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> ApplicationRead:
    """Change the application's status, recomputing all derived fields.

    Protected fields (stage, last_status_change_at, needs_follow_up …)
    are computed server-side and cannot be sent in the request body.
    """
    svc = ApplicationsService(db)
    app = await svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    updated = await svc.change_status(app, payload, current_user.id)
    return ApplicationRead.model_validate(updated)


@router.delete(
    "/{app_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Archive application",
)
async def delete_application(
    app_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
) -> None:
    """Soft-delete: sets archived=True. The record remains queryable via
    GET /applications?archived=true."""
    svc = ApplicationsService(db)
    app = await svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found",
        )
    await svc.archive(app, current_user.id)
