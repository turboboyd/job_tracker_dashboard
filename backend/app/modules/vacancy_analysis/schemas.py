from __future__ import annotations

from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator

AnalysisType = Literal["basic", "ai"]
AnalysisProvider = Literal["deterministic", "ollama", "openai", "gemini", "groq"]
PlanName = Literal["free", "basic", "premium"]


class VacancyAnalysisCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    analysis_type: AnalysisType = "basic"
    # Optional: when omitted/blank the service falls back to the resume saved on
    # the user's profile (and errors if neither is available).
    resume_text: str | None = Field(default=None, max_length=20_000)
    language: str = Field(default="ru", min_length=2, max_length=8)
    include_cover_letter: bool = False
    include_interview_questions: bool = False

    @field_validator("resume_text")
    @classmethod
    def normalize_resume_text(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = value.strip()
        return normalized or None


class VacancyAnalysisQuota(BaseModel):
    plan: PlanName
    basic_used: int
    basic_limit: int
    ai_used: int
    ai_limit: int
    day: date


class VacancyAnalysisRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    loop_id: str
    match_id: UUID
    analysis_type: AnalysisType
    provider: AnalysisProvider
    model: str
    plan: PlanName
    resume_hash: str
    vacancy_snapshot: dict
    overall_score: int = Field(..., ge=0, le=100)
    summary: str
    strengths: list[str]
    gaps: list[str]
    risks: list[str]
    recommended_cv_keywords: list[str]
    application_angle: str
    cover_letter_draft: str | None
    interview_questions: list[str]
    model_info: dict
    quota_day: date
    created_at: datetime


class VacancyAnalysisResponse(VacancyAnalysisRead):
    quota: VacancyAnalysisQuota


class VacancyAnalysisListResponse(BaseModel):
    items: list[VacancyAnalysisRead]
    total: int
    limit: int
    offset: int
