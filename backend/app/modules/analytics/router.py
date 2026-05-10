from __future__ import annotations

from fastapi import APIRouter, Query

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.analytics.schemas import KpiResponse, RangeParam
from app.modules.analytics.service import AnalyticsService

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get(
    "/kpi",
    response_model=KpiResponse,
    summary="KPI summary for the current user's applications",
)
async def get_kpi(
    current_user: CurrentUser,
    db: DbSession,
    range: RangeParam = Query(default="30d", description="Time range: 7d | 30d | 90d | all"),
) -> KpiResponse:
    svc = AnalyticsService(db)
    return await svc.get_kpi(current_user.id, range)
