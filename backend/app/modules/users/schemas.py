from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator

PlanName = Literal["free", "basic", "premium"]


class UserRead(BaseModel):
    """Public representation of a local user (returned by GET/PATCH /users/me)."""

    id: UUID
    firebase_uid: str
    email: str | None
    display_name: str | None
    photo_url: str | None
    language: str
    timezone: str
    date_format: str
    analysis_plan: PlanName
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("analysis_plan", mode="before")
    @classmethod
    def default_analysis_plan(cls, value: object) -> str:
        if value in ("free", "basic", "premium"):
            return str(value)
        return "free"


class UserPatch(BaseModel):
    """Fields the user is allowed to update themselves.

    - display_name: locally overrideable; None = skip (do not clear)
    - language / timezone / date_format: preference fields; None = skip
    - firebase_uid / email / id / created_at: immutable, not exposed here
    """

    display_name: str | None = None
    language: str | None = None
    timezone: str | None = None
    date_format: str | None = None

    model_config = ConfigDict(extra="forbid")


class AnalysisPlanLimits(BaseModel):
    basic_daily_limit: int
    ai_daily_limit: int


class AnalysisPlanFeatures(BaseModel):
    cover_letter: Literal["disabled", "short_template", "enabled"]
    interview_questions: bool
    cv_keywords: bool
    multi_match_comparison: bool
    priority: Literal["normal", "high"]


class AnalysisPlanRead(BaseModel):
    plan: PlanName
    limits: AnalysisPlanLimits
    features: AnalysisPlanFeatures
