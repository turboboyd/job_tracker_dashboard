from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.deps import CurrentUser
from app.core.config import Settings, get_settings
from app.db.session import DbSession
from app.modules.dev_tools.schemas import (
    DevAnalysisPlanPatch,
    DevAnalysisPlanUpdateResponse,
)
from app.modules.users.service import UsersService

router = APIRouter(prefix="/dev", tags=["dev-tools"])


def get_dev_tools_service(db: DbSession) -> UsersService:
    return UsersService(db)


DevToolsService = Annotated[UsersService, Depends(get_dev_tools_service)]
SettingsDep = Annotated[Settings, Depends(get_settings)]


@router.patch(
    "/users/me/analysis-plan",
    response_model=DevAnalysisPlanUpdateResponse,
    summary="Development-only current user analysis plan switch",
)
async def patch_my_analysis_plan_for_dev(
    payload: DevAnalysisPlanPatch,
    current_user: CurrentUser,
    service: DevToolsService,
    settings: SettingsDep,
) -> DevAnalysisPlanUpdateResponse:
    """Set current user's analysis plan for local development testing only."""
    if not settings.is_development:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")

    updated = await service.set_user_analysis_plan_for_admin(current_user, payload.plan)
    return DevAnalysisPlanUpdateResponse(
        plan=updated.analysis_plan,  # type: ignore[arg-type]
        message="Analysis plan updated for development testing.",
    )
