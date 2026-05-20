from __future__ import annotations

from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Query, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.vacancy_analysis.schemas import (
    VacancyAnalysisCreate,
    VacancyAnalysisListResponse,
    VacancyAnalysisRead,
    VacancyAnalysisResponse,
)
from app.modules.vacancy_analysis.service import VacancyAnalysisService

router = APIRouter(
    prefix="/loops/{loop_id}/matches/{match_id}/analyses",
    tags=["vacancy-analysis"],
)


def get_vacancy_analysis_service(db: DbSession) -> VacancyAnalysisService:
    return VacancyAnalysisService(db)


VacancyAnalysisSvc = Annotated[
    VacancyAnalysisService,
    Depends(get_vacancy_analysis_service),
]


@router.post(
    "",
    response_model=VacancyAnalysisResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create and save vacancy analysis",
)
async def create_analysis(
    loop_id: str,
    match_id: UUID,
    payload: VacancyAnalysisCreate,
    current_user: CurrentUser,
    svc: VacancyAnalysisSvc,
) -> VacancyAnalysisResponse:
    return await svc.create(current_user, loop_id, match_id, payload)


@router.get(
    "",
    response_model=VacancyAnalysisListResponse,
    summary="List saved vacancy analyses for a match",
)
async def list_analyses(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyAnalysisSvc,
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> VacancyAnalysisListResponse:
    return await svc.list_for_match(
        current_user,
        loop_id,
        match_id,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/latest",
    response_model=VacancyAnalysisRead,
    summary="Get latest saved vacancy analysis for a match",
)
async def latest_analysis(
    loop_id: str,
    match_id: UUID,
    current_user: CurrentUser,
    svc: VacancyAnalysisSvc,
) -> VacancyAnalysisRead:
    return await svc.latest_for_match(current_user, loop_id, match_id)
