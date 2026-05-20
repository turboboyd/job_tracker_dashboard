from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.activity.service import ActivityService
from app.modules.applications.service import ApplicationsService
from app.modules.history.schemas import (
    CommentRequest,
    HistoryItemRead,
    HistoryListResponse,
    HistoryTypeFilter,
)
from app.modules.history.service import HistoryService

router = APIRouter(tags=["history"])


@router.get(
    "/applications/{app_id}/history",
    response_model=HistoryListResponse,
    summary="List application history",
)
async def list_history(
    app_id: UUID,
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    type: HistoryTypeFilter | None = Query(
        default=None,
        description="Filter by history event type",
    ),
) -> HistoryListResponse:
    app_svc = ApplicationsService(db)
    app = await app_svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    history_svc = HistoryService(db)
    items, total = await history_svc.list_for_application(
        current_user,
        app_id,
        limit=limit,
        offset=offset,
        event_type=type,
    )
    return HistoryListResponse(
        items=[HistoryItemRead.model_validate(i) for i in items],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post(
    "/applications/{app_id}/comments",
    response_model=HistoryItemRead,
    status_code=status.HTTP_201_CREATED,
    summary="Add a comment to an application",
)
async def add_comment(
    app_id: UUID,
    payload: CommentRequest,
    current_user: CurrentUser,
    db: DbSession,
) -> HistoryItemRead:
    app_svc = ApplicationsService(db)
    app = await app_svc.get_owned(current_user, app_id)
    if app is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Application not found")

    history_svc = HistoryService(db)
    item = await history_svc.record_comment(
        app.id,
        current_user.id,
        text=payload.text,
        feedback_type=payload.feedback_type,
        sentiment=payload.sentiment,
        rejection_reason_code=payload.rejection_reason_code,
        correlation_id=payload.correlation_id,
    )

    activity_svc = ActivityService(db)
    await activity_svc.record_comment_added(app, current_user.id)

    return HistoryItemRead.model_validate(item)
