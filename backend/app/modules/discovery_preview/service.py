from __future__ import annotations

from fastapi import status

from app.core.errors import APIError
from app.db.models.user import User
from app.modules.discovery_preview.schemas import (
    DiscoveryPreviewMatchPayload,
    DiscoveryPreviewRequest,
    DiscoveryPreviewResponse,
)
from app.modules.discovery_sources.registry import get_discovery_source
from app.modules.loops.service import LoopsService
from app.modules.vacancy_import.service import VacancyImportService


class DiscoveryPreviewError(APIError):
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
    ) -> None:
        super().__init__(code, message, status_code)


class DiscoveryPreviewService:
    def __init__(
        self,
        loops: LoopsService,
        import_service: VacancyImportService,
    ) -> None:
        self._loops = loops
        self._import = import_service

    async def preview(
        self,
        user: User,
        payload: DiscoveryPreviewRequest,
    ) -> DiscoveryPreviewResponse:
        source = get_discovery_source(payload.source_id)
        if source is None:
            raise DiscoveryPreviewError(
                "UNKNOWN_DISCOVERY_SOURCE",
                "Discovery source is not registered",
            )
        if not source.enabled:
            raise DiscoveryPreviewError(
                "DISCOVERY_SOURCE_DISABLED",
                "Discovery source is disabled",
            )
        if not source.capabilities.manual_import:
            raise DiscoveryPreviewError(
                "DISCOVERY_SOURCE_MANUAL_PREVIEW_UNSUPPORTED",
                "Discovery source does not support manual URL preview",
            )

        await self._loops.require_owned_active(user, payload.loop_id)
        preview = await self._import.preview(payload.url)
        warnings = list(preview.warnings)

        return DiscoveryPreviewResponse(
            loop_id=payload.loop_id,
            source_id=source.id,
            status="ready",
            normalized_url=preview.source_url,
            title=preview.role_title,
            company=preview.company_name,
            location=preview.location_text,
            snippet=preview.vacancy_description,
            external_id=None,
            warnings=warnings,
            can_create_match=True,
            match=DiscoveryPreviewMatchPayload(
                loop_id=payload.loop_id,
                source_id=source.id,
                source_url=preview.source_url,
                source=preview.source,
                company_name=preview.company_name,
                role_title=preview.role_title,
                location_text=preview.location_text,
                vacancy_description=preview.vacancy_description,
                confidence=preview.confidence,
                warnings=warnings,
            ),
        )
