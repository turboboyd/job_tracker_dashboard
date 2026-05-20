from __future__ import annotations

from dataclasses import dataclass
from typing import Literal

PlanName = Literal["free", "basic", "premium"]
AnalysisType = Literal["basic", "ai"]


@dataclass(frozen=True)
class PlanPolicy:
    name: PlanName
    basic_daily_limit: int
    ai_daily_limit: int
    cover_letter: bool
    short_cover_letter_template: bool
    interview_questions: bool
    cv_keywords: bool
    multi_match_comparison: bool
    priority: Literal["normal", "high"]


PLAN_POLICIES: dict[PlanName, PlanPolicy] = {
    "free": PlanPolicy(
        name="free",
        basic_daily_limit=10,
        ai_daily_limit=1,
        cover_letter=False,
        short_cover_letter_template=True,
        interview_questions=False,
        cv_keywords=True,
        multi_match_comparison=False,
        priority="normal",
    ),
    "basic": PlanPolicy(
        name="basic",
        basic_daily_limit=100,
        ai_daily_limit=50,
        cover_letter=True,
        short_cover_letter_template=False,
        interview_questions=True,
        cv_keywords=True,
        multi_match_comparison=False,
        priority="normal",
    ),
    "premium": PlanPolicy(
        name="premium",
        basic_daily_limit=300,
        ai_daily_limit=100,
        cover_letter=True,
        short_cover_letter_template=False,
        interview_questions=True,
        cv_keywords=True,
        multi_match_comparison=True,
        priority="high",
    ),
}


def normalize_plan(value: object) -> PlanName:
    if value in PLAN_POLICIES:
        return value  # type: ignore[return-value]
    return "free"


def resolve_user_plan(user: object) -> PlanName:
    return normalize_plan(getattr(user, "analysis_plan", None))


def get_plan_policy(plan: PlanName) -> PlanPolicy:
    return PLAN_POLICIES[plan]
