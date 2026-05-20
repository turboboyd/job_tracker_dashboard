from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.discovery_runs.schemas import DiscoveryRunRequest, DiscoveryRunResponse
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopsService

router = APIRouter(prefix="/discovery-runs", tags=["discovery-runs"])


def get_discovery_runs_service(db: DbSession) -> DiscoveryRunsService:
    return DiscoveryRunsService(LoopsService(db))


DiscoveryRunsSvc = Annotated[
    DiscoveryRunsService,
    Depends(get_discovery_runs_service),
]


@router.post(
    "",
    response_model=DiscoveryRunResponse,
    status_code=status.HTTP_200_OK,
    summary="Run safe discovery evaluation without fetching sources",
)
async def create_discovery_run(
    payload: DiscoveryRunRequest,
    current_user: CurrentUser,
    svc: DiscoveryRunsSvc,
) -> DiscoveryRunResponse:
    return await svc.run(current_user, payload)
