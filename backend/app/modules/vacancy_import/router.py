from __future__ import annotations

import httpx
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.deps import CurrentUser
from app.modules.vacancy_import.fetcher import VacancyImportFetchError
from app.modules.vacancy_import.schemas import (
    VacancyImportPreviewRequest,
    VacancyImportPreviewResponse,
)
from app.modules.vacancy_import.service import VacancyImportService, get_vacancy_import_service
from app.modules.vacancy_import.validation import VacancyImportValidationError

router = APIRouter(prefix="/vacancy-import", tags=["vacancy-import"])


@router.post(
    "/preview",
    response_model=VacancyImportPreviewResponse,
    summary="Preview a single user-provided vacancy URL",
)
async def preview_vacancy_import(
    payload: VacancyImportPreviewRequest,
    current_user: CurrentUser,
    service: VacancyImportService = Depends(get_vacancy_import_service),
) -> VacancyImportPreviewResponse:
    """Fetch and parse one user-provided vacancy URL for an editable preview.

    The endpoint does not create or persist applications and does not store imported HTML.
    """
    _ = current_user
    try:
        return await service.preview(payload.url)
    except VacancyImportValidationError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
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
