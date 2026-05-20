from __future__ import annotations

from typing import Annotated

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.deps import CurrentUser
from app.db.session import DbSession
from app.modules.discovery_preview.schemas import (
    DiscoveryPreviewRequest,
    DiscoveryPreviewResponse,
)
from app.modules.discovery_preview.service import DiscoveryPreviewService
from app.modules.loops.service import LoopsService
from app.modules.vacancy_import.fetcher import VacancyImportFetchError
from app.modules.vacancy_import.service import (
    VacancyImportService,
    get_vacancy_import_service,
)
from app.modules.vacancy_import.validation import VacancyImportValidationError

router = APIRouter(prefix="/discovery-preview", tags=["discovery-preview"])


def get_discovery_preview_service(
    db: DbSession,
    import_service: VacancyImportService = Depends(get_vacancy_import_service),
) -> DiscoveryPreviewService:
    return DiscoveryPreviewService(LoopsService(db), import_service)


DiscoveryPreviewSvc = Annotated[
    DiscoveryPreviewService,
    Depends(get_discovery_preview_service),
]


@router.post(
    "",
    response_model=DiscoveryPreviewResponse,
    summary="Preview a manual source input without saving it",
)
async def preview_discovery_source(
    payload: DiscoveryPreviewRequest,
    current_user: CurrentUser,
    svc: DiscoveryPreviewSvc,
) -> DiscoveryPreviewResponse:
    try:
        return await svc.preview(current_user, payload)
    except VacancyImportValidationError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except VacancyImportFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=str(exc),
        ) from exc
    except httpx.TimeoutException as exc:
        raise HTTPException(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            detail="Vacancy URL timed out",
        ) from exc
    except httpx.HTTPStatusError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Vacancy URL returned HTTP {exc.response.status_code}",
        ) from exc
    except httpx.HTTPError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Could not fetch vacancy URL",
        ) from exc
