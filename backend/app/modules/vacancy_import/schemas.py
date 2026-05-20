from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class VacancyImportPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(..., min_length=1, max_length=2048)


class VacancyImportPreviewResponse(BaseModel):
    source_url: str
    source: str
    company_name: str | None
    role_title: str | None
    location_text: str | None
    vacancy_description: str | None
    confidence: dict[str, float]
    warnings: list[str]
