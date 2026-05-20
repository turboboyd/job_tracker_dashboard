from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


class DiscoveryPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    loop_id: str = Field(..., min_length=1, max_length=64)
    source_id: str = Field(..., min_length=1, max_length=64)
    url: str = Field(..., min_length=1, max_length=2048)


class DiscoveryPreviewMatchPayload(BaseModel):
    loop_id: str
    source_id: str
    source_url: str
    source: str | None
    company_name: str | None
    role_title: str | None
    location_text: str | None
    vacancy_description: str | None
    confidence: dict[str, float]
    warnings: list[str]
    status: Literal["saved"] = "saved"


class DiscoveryPreviewResponse(BaseModel):
    loop_id: str
    source_id: str
    status: Literal["ready", "limited"]
    normalized_url: str
    title: str | None
    company: str | None
    location: str | None
    snippet: str | None
    external_id: str | None = None
    warnings: list[str]
    can_create_match: bool
    match: DiscoveryPreviewMatchPayload
