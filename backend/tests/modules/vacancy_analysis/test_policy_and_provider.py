from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

from app.modules.vacancy_analysis.policy import PLAN_POLICIES
from app.modules.vacancy_analysis.providers import DeterministicAnalysisProvider


def make_loop(**overrides):
    data = {
        "target_role": "Backend Engineer",
        "location": "Berlin",
        "keywords": ["Python", "FastAPI"],
        "excluded_keywords": [],
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_match(**overrides):
    data = {
        "id": uuid4(),
        "role_title": "Python Backend Engineer",
        "company_name": "Acme GmbH",
        "location_text": "Berlin",
        "source_url": "https://example.com/job",
        "source": "manual_url",
        "vacancy_description": "Build Python APIs with FastAPI and PostgreSQL.",
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_plan_limits_match_product_policy() -> None:
    assert PLAN_POLICIES["free"].basic_daily_limit == 10
    assert PLAN_POLICIES["free"].ai_daily_limit == 1
    assert PLAN_POLICIES["basic"].ai_daily_limit == 50
    assert PLAN_POLICIES["premium"].ai_daily_limit == 100
    assert PLAN_POLICIES["premium"].priority == "high"


def test_deterministic_provider_returns_explainable_analysis() -> None:
    result = DeterministicAnalysisProvider().analyze(
        loop=make_loop(),
        match=make_match(),
        resume_text="Python FastAPI PostgreSQL backend engineer",
        language="ru",
        plan=PLAN_POLICIES["basic"],
        analysis_type="ai",
        include_cover_letter=True,
        include_interview_questions=True,
    )

    assert result.provider == "deterministic"
    assert result.model == "deterministic-v1"
    assert result.model_info["mode"] == "deterministic"
    assert result.model_info["external_call"] is False
    assert result.overall_score > 50
    assert result.strengths
    assert result.recommended_cv_keywords
    assert result.cover_letter_draft is not None
    assert result.interview_questions
