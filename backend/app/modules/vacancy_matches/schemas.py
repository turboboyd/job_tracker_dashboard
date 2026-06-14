from __future__ import annotations

from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.modules.applications.schemas import ApplicationRead, ProcessStatus
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse

VacancyMatchStatus = Literal["new", "saved", "converted"]
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
    seen_at: datetime | None = None
    posted_at: datetime | None = None
    # Persisted 0–100 match score from the scoring core. None = not yet scored
    # (rows created before migration 0023).
    score: int | None = None
    score_version: int | None = None
    created_at: datetime
    updated_at: datetime


class VacancyMatchListResponse(BaseModel):
    items: list[VacancyMatchRead]
    total: int
    limit: int
    offset: int


# ── Cross-loop matches feed (GET /matches) ─────────────────────────────────
MatchesFeedTab = Literal["all", "new", "saved"]
# "posted" (freshness) stays the default; "score" orders by the persisted match
# score (DESC NULLS LAST) with the freshness chain as tie-break.
MatchesFeedSort = Literal["posted", "company", "loop", "score"]

# Sort options for the per-loop matches list. "freshness" is the default and
# preserves the existing behavior; "score" enables the score-ranked Top-N view.
LoopMatchesSort = Literal["freshness", "score"]


class MatchesFeedItem(VacancyMatchRead):
    """A feed row: a vacancy match plus its owning loop's display name."""

    loop_name: str | None = None


class MatchesFeedCounts(BaseModel):
    """Tab badge counts, computed under the same q/source/loop scope.

    Each count applies its own status rule regardless of the active tab, so the
    badges stay stable while the user switches tabs.
    """

    all: int
    new: int
    saved: int


class MatchesFeedResponse(BaseModel):
    items: list[MatchesFeedItem]
    total: int
    limit: int
    offset: int
    counts: MatchesFeedCounts


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


class ScoreReasonEntry(BaseModel):
    """Machine-readable scoring explanation entry. Clients localize by ``code``
    (terms carry the matched tokens/keywords) instead of parsing the legacy
    English strings."""

    code: str
    terms: list[str] = Field(default_factory=list)


class VacancyMatchEvaluationResponse(BaseModel):
    match_id: UUID
    loop_id: str
    total_score: int = Field(..., ge=0, le=100)
    title_match_score: int = Field(..., ge=0, le=100)
    location_match_score: int = Field(..., ge=0, le=100)
    # Not scored in v1 (the match carries no employment-type / work-mode data);
    # kept emitting 0 for backward compatibility until Stage 6e.
    employment_type_match_score: int = Field(..., ge=0, le=100)
    work_mode_match_score: int = Field(..., ge=0, le=100)
    keyword_score: int = Field(..., ge=0, le=100)
    excluded_keyword_penalty: int = Field(..., ge=0, le=100)
    source_score: int = Field(..., ge=0, le=100)
    # Legacy human-readable strings (kept verbatim for current clients) …
    reasons: list[str]
    penalties: list[str]
    # … plus the coded equivalents new clients should consume.
    reason_codes: list[ScoreReasonEntry] = Field(default_factory=list)
    penalty_codes: list[ScoreReasonEntry] = Field(default_factory=list)
    duplicate_status: DuplicateStatus
    duplicate_of_match_id: UUID | None
    duplicate_application_id: UUID | None
    duplicate_reasons: list[str]


VacancyMatchPreviewResponse = VacancyImportPreviewResponse
