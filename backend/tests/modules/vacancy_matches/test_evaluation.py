from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

from app.modules.vacancy_matches.evaluation import (
    evaluate_vacancy_match,
    normalize_text,
    normalize_url,
)

LOOP_ID = "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0"
MATCH_ID = uuid4()
OTHER_MATCH_ID = uuid4()
APP_ID = uuid4()


def make_loop(**overrides):
    data = {
        "id": LOOP_ID,
        "target_role": "Python Backend Engineer",
        "location": "Berlin",
        "keywords": ["Python", "FastAPI"],
        "excluded_keywords": [],
        "employment_types": ["full_time"],
        "work_modes": ["remote"],
        "selected_sources": ["stepstone"],
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_match(**overrides):
    data = {
        "id": MATCH_ID,
        "loop_id": LOOP_ID,
        "source_url": "https://example.com/jobs/123?utm_source=newsletter",
        "source": "stepstone",
        "company_name": "Acme GmbH",
        "role_title": "Senior Python Backend Engineer",
        "location_text": "Berlin",
        "vacancy_description": "Build APIs with Python and FastAPI.",
        "application_id": None,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_application(**overrides):
    data = {
        "id": APP_ID,
        "vacancy_url": "https://example.com/jobs/123",
        "company_name": "Acme GmbH",
        "role_title": "Senior Python Backend Engineer",
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_normalize_helpers_are_deterministic() -> None:
    assert normalize_text("  Senior Python-Engineer! ") == "senior python engineer"
    assert (
        normalize_url("HTTPS://Example.COM/jobs/123/?utm_source=x&keep=1")
        == "https://example.com/jobs/123?keep=1"
    )


def test_keyword_title_location_and_selected_source_increase_score() -> None:
    result = evaluate_vacancy_match(
        match=make_match(),
        loop=make_loop(),
        existing_matches=[],
        applications=[],
    )

    assert result.total_score >= 70
    assert result.title_match_score > 0
    assert result.location_match_score == 10
    assert result.keyword_score == 20
    assert result.source_score == 15
    assert any("Matched keyword: Python." == reason for reason in result.reasons)
    assert result.duplicate_status == "none"


def test_excluded_keyword_adds_penalty_and_reduces_score() -> None:
    clean = evaluate_vacancy_match(
        match=make_match(),
        loop=make_loop(),
        existing_matches=[],
        applications=[],
    )
    penalized = evaluate_vacancy_match(
        match=make_match(vacancy_description="Python FastAPI contract only."),
        loop=make_loop(excluded_keywords=["contract"]),
        existing_matches=[],
        applications=[],
    )

    assert penalized.excluded_keyword_penalty == 15
    assert "Matched excluded keyword: contract." in penalized.penalties
    assert penalized.total_score < clean.total_score


def test_unselected_source_adds_penalty_without_source_score() -> None:
    result = evaluate_vacancy_match(
        match=make_match(source="linkedin"),
        loop=make_loop(selected_sources=["stepstone"]),
        existing_matches=[],
        applications=[],
    )

    assert result.source_score == 0
    assert "Source is not selected for this Loop." in result.penalties


def test_same_source_url_detects_exact_duplicate_match() -> None:
    result = evaluate_vacancy_match(
        match=make_match(),
        loop=make_loop(),
        existing_matches=[make_match(id=OTHER_MATCH_ID, source_url="https://example.com/jobs/123")],
        applications=[],
    )

    assert result.duplicate_status == "exact_duplicate"
    assert result.duplicate_of_match_id == OTHER_MATCH_ID
    assert result.duplicate_application_id is None


def test_same_title_company_source_detects_likely_duplicate_match() -> None:
    result = evaluate_vacancy_match(
        match=make_match(source_url="https://example.com/jobs/abc"),
        loop=make_loop(),
        existing_matches=[
            make_match(id=OTHER_MATCH_ID, source_url="https://example.com/jobs/xyz")
        ],
        applications=[],
    )

    assert result.duplicate_status == "likely_duplicate"
    assert result.duplicate_of_match_id == OTHER_MATCH_ID


def test_same_title_company_location_detects_possible_duplicate_match() -> None:
    result = evaluate_vacancy_match(
        match=make_match(source="indeed", source_url="https://example.com/jobs/abc"),
        loop=make_loop(),
        existing_matches=[
            make_match(
                id=OTHER_MATCH_ID,
                source="stepstone",
                source_url="https://example.com/jobs/xyz",
            )
        ],
        applications=[],
    )

    assert result.duplicate_status == "possible_duplicate"
    assert result.duplicate_of_match_id == OTHER_MATCH_ID


def test_existing_application_produces_duplicate_warning_without_mutation() -> None:
    app = make_application(vacancy_url="https://other.example/jobs/1")
    result = evaluate_vacancy_match(
        match=make_match(source_url="https://example.com/jobs/abc"),
        loop=make_loop(),
        existing_matches=[],
        applications=[app],
    )

    assert result.duplicate_status == "possible_duplicate"
    assert result.duplicate_application_id == APP_ID
    assert "Same company and title as an existing application." in result.duplicate_reasons
    assert app.role_title == "Senior Python Backend Engineer"
