from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.applications.schemas import ApplicationRead, ProcessStatus
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse

VacancyMatchStatus = Literal["new", "saved", "ignored", "converted"]
DuplicateStatus = Literal[
    "none",
    "possible_duplicate",
    "likely_duplicate",
    "exact_duplicate",
]


class VacancyMatchCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_url: str = Field(..., min_length=1, max_length=2048)
    source: str | None = None
    external_id: str | None = Field(default=None, max_length=255)
    company_name: str | None = None
    role_title: str | None = None
    location_text: str | None = None
    vacancy_description: str | None = None
    raw_metadata: dict = Field(default_factory=dict)
    confidence: dict[str, float] = Field(default_factory=dict)
    warnings: list[str] = Field(default_factory=list)
    status: VacancyMatchStatus = "saved"


class VacancyMatchPatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_name: str | None = None
    role_title: str | None = None
    location_text: str | None = None
    vacancy_description: str | None = None
    status: VacancyMatchStatus | None = None


class VacancyMatchRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    loop_id: str
    source_url: str
    source: str | None
    external_id: str | None = None
    company_name: str | None
    role_title: str | None
    location_text: str | None
    vacancy_description: str | None
    raw_metadata: dict = Field(default_factory=dict)
    confidence: dict[str, float]
    warnings: list[str]
    status: str
    application_id: UUID | None
    created_at: datetime
    updated_at: datetime


class VacancyMatchListResponse(BaseModel):
    items: list[VacancyMatchRead]
    total: int
    limit: int
    offset: int


class ConvertMatchResponse(BaseModel):
    application_id: UUID
    match: VacancyMatchRead


class CreateApplicationFromMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ProcessStatus = "SAVED"
    notes: str | None = Field(default=None, max_length=5000)
    favorite: bool = False

    @field_validator("notes")
    @classmethod
    def _strip_notes(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class CreateApplicationFromMatchResponse(BaseModel):
    application: ApplicationRead
    match: VacancyMatchRead
    created: bool
    already_linked: bool


class VacancyMatchFromPreviewRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-z0-9_]+$")
    external_id: str | None = Field(default=None, max_length=255)
    source_url: str = Field(..., min_length=1, max_length=2048)
    title: str | None = Field(default=None, max_length=500)
    company: str | None = Field(default=None, max_length=500)
    location: str | None = Field(default=None, max_length=500)
    description: str | None = Field(default=None, max_length=5000)
    posted_at: str | None = Field(default=None, max_length=120)
    raw_metadata: dict = Field(default_factory=dict)
    confidence: dict[str, float] = Field(default_factory=dict)

    @field_validator("title", "company", "location", "description", "posted_at", "external_id")
    @classmethod
    def _strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class VacancyMatchFromPreviewResponse(BaseModel):
    match: VacancyMatchRead
    created: bool
    duplicate: bool


class ApplicationFromPreviewResponse(BaseModel):
    application: ApplicationRead
    match_id: UUID | None = None
    application_id: UUID
    created: bool
    duplicate: bool


class VacancyPreviewIgnoreRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(..., min_length=1, max_length=64, pattern=r"^[a-z0-9_]+$")
    external_id: str | None = Field(default=None, max_length=255)
    source_url: str = Field(..., min_length=1, max_length=2048)
    title: str | None = Field(default=None, max_length=500)
    company: str | None = Field(default=None, max_length=500)

    @field_validator("title", "company", "external_id")
    @classmethod
    def _strip_optional_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        stripped = value.strip()
        return stripped or None


class VacancyPreviewIgnoreRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    user_id: UUID
    loop_id: str
    source_id: str
    external_id: str | None = None
    source_url: str
    title: str | None = None
    company: str | None = None
    created_at: datetime
    updated_at: datetime


class VacancyPreviewIgnoreResponse(BaseModel):
    item: VacancyPreviewIgnoreRead
    created: bool
    duplicate: bool


class VacancyPreviewIgnoreListResponse(BaseModel):
    items: list[VacancyPreviewIgnoreRead]
    total: int
    limit: int
    offset: int


class VacancyMatchEvaluationResponse(BaseModel):
    match_id: UUID
    loop_id: str
    total_score: int = Field(..., ge=0, le=100)
    title_match_score: int = Field(..., ge=0, le=100)
    location_match_score: int = Field(..., ge=0, le=100)
    employment_type_match_score: int = Field(..., ge=0, le=100)
    work_mode_match_score: int = Field(..., ge=0, le=100)
    keyword_score: int = Field(..., ge=0, le=100)
    excluded_keyword_penalty: int = Field(..., ge=0, le=100)
    source_score: int = Field(..., ge=0, le=100)
    reasons: list[str]
    penalties: list[str]
    duplicate_status: DuplicateStatus
    duplicate_of_match_id: UUID | None
    duplicate_application_id: UUID | None
    duplicate_reasons: list[str]


VacancyMatchPreviewResponse = VacancyImportPreviewResponse
