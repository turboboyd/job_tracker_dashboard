from fastapi import APIRouter, Query

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.activity.schemas import ActivityEventRead, ActivityFeedResponse
from app.modules.activity.service import ActivityService

router = APIRouter(prefix="/activity", tags=["activity"])


@router.get(
    "/feed",
    response_model=ActivityFeedResponse,
    summary="Activity feed for the current user",
)
async def get_feed(
    current_user: CurrentUser,
    db: DbSession,
    limit: int = Query(default=50, ge=1, le=100),
    kind: str | None = Query(default=None, description="Filter by event kind"),
) -> ActivityFeedResponse:
    svc = ActivityService(db)
    events = await svc.list_for_user(current_user.id, kind=kind, limit=limit)
    return ActivityFeedResponse(
        items=[ActivityEventRead.model_validate(e) for e in events]
    )
