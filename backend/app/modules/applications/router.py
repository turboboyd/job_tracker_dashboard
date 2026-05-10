from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.applications.schemas import ApplicationCreate, ApplicationPatch, ApplicationRead
from app.modules.applications.service import ApplicationsService

router = APIRouter(prefix="/applications", tags=["applications"])


@router.get("", response_model=list[ApplicationRead], summary="List applications")
async def list_applications(
    current_user: CurrentUser,
    db: DbSession,
    archived: bool = Query(default=False, description="Include archived applications"),
    status: str | None = Query(
        default=None,
        description="Comma-separated ProcessStatus values to filter by",
    ),
) -> list[ApplicationRead]:
    statuses = [s.strip() for s in status.split(",")] if status else None
    svc = ApplicationsService(db)
    apps = await svc.list_for_user(current_user, archived=archived, statuses=statuses)
    return [ApplicationRead.model_validate(a) for a in apps]


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
    updated = await svc.patch(app, payload)
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
    await svc.archive(app)
