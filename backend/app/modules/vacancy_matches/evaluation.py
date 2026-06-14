"""Vacancy-match evaluation: score assembly + duplicate detection.

Scoring itself lives in ``scoring.py`` (the single scoring core, see Stage 6c).
This module keeps two responsibilities:
- duplicate detection against the loop's other matches and the user's
  applications (unchanged);
- assembling the backward-compatible ``VacancyMatchEvaluationResponse`` from a
  ``ScoreResult`` (legacy English reason strings preserved verbatim, plus the
  new machine-readable ``reason_codes``/``penalty_codes``).

``normalize_text`` is re-exported from ``scoring`` so existing importers keep
working.
"""

from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from uuid import UUID

from app.db.models.application import Application
from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_matches.schemas import (
    ScoreReasonEntry,
    VacancyMatchEvaluationResponse,
)
from app.modules.vacancy_matches.scoring import (
    normalize_text,
    render_penalty,
    render_reason,
    score_input_from_match,
    score_match,
)

__all__ = ["evaluate_vacancy_match", "normalize_text", "normalize_url"]

_TRACKING_QUERY_PREFIXES = ("utm_",)
_TRACKING_QUERY_KEYS = {"fbclid", "gclid", "yclid"}


@dataclass(frozen=True)
class _DedupResult:
    duplicate_status: str
    duplicate_of_match_id: UUID | None
    duplicate_application_id: UUID | None
    duplicate_reasons: list[str]


def normalize_url(value: str | None) -> str:
    if not value:
        return ""
    parsed = urlsplit(value.strip())
    scheme = parsed.scheme.casefold()
    netloc = parsed.netloc.casefold()
    path = parsed.path.rstrip("/")
    query_items = [
        (key, val)
        for key, val in parse_qsl(parsed.query, keep_blank_values=True)
        if key not in _TRACKING_QUERY_KEYS
        and not any(key.startswith(prefix) for prefix in _TRACKING_QUERY_PREFIXES)
    ]
    query = urlencode(query_items)
    return urlunsplit((scheme, netloc, path, query, ""))


def evaluate_vacancy_match(
    *,
    match: VacancyMatch,
    loop: Loop,
    existing_matches: list[VacancyMatch],
    applications: list[Application],
) -> VacancyMatchEvaluationResponse:
    score = score_match(loop, score_input_from_match(match))
    dedup = _detect_duplicate(match, existing_matches, applications)
    return VacancyMatchEvaluationResponse(
        match_id=match.id,
        loop_id=match.loop_id,
        total_score=score.total,
        title_match_score=score.components["title"],
        location_match_score=score.components["location"],
        # Not scored in v1: the vacancy side carries no employment-type /
        # work-mode fields yet. Kept at 0 for response backward compatibility
        # (removal is deferred to Stage 6e after frontend adoption).
        employment_type_match_score=0,
        work_mode_match_score=0,
        keyword_score=score.components["keywords"],
        excluded_keyword_penalty=score.components["excluded_penalty"],
        source_score=score.components["source"],
        reasons=[render_reason(reason) for reason in score.reasons],
        penalties=[render_penalty(penalty) for penalty in score.penalties],
        reason_codes=[
            ScoreReasonEntry(code=reason.code, terms=list(reason.terms))
            for reason in score.reasons
        ],
        penalty_codes=[
            ScoreReasonEntry(code=penalty.code, terms=list(penalty.terms))
            for penalty in score.penalties
        ],
        duplicate_status=dedup.duplicate_status,
        duplicate_of_match_id=dedup.duplicate_of_match_id,
        duplicate_application_id=dedup.duplicate_application_id,
        duplicate_reasons=dedup.duplicate_reasons,
    )


def _detect_duplicate(
    match: VacancyMatch,
    existing_matches: list[VacancyMatch],
    applications: list[Application],
) -> _DedupResult:
    match_url = normalize_url(match.source_url)
    match_title = normalize_text(match.role_title)
    match_company = normalize_text(match.company_name)
    match_location = normalize_text(match.location_text)
    match_source = normalize_text(match.source)
    duplicate_reasons: list[str] = []

    for other in existing_matches:
        if other.id == match.id:
            continue
        if match_url and match_url == normalize_url(other.source_url):
            return _DedupResult(
                duplicate_status="exact_duplicate",
                duplicate_of_match_id=other.id,
                duplicate_application_id=None,
                duplicate_reasons=["Same normalized source URL as another vacancy match."],
            )
        if (
            match_title
            and match_company
            and match_title == normalize_text(other.role_title)
            and match_company == normalize_text(other.company_name)
            and match_source
            and match_source == normalize_text(other.source)
        ):
            return _DedupResult(
                duplicate_status="likely_duplicate",
                duplicate_of_match_id=other.id,
                duplicate_application_id=None,
                duplicate_reasons=["Same company, title, and source as another vacancy match."],
            )
        if (
            match_title
            and match_company
            and match_location
            and match_title == normalize_text(other.role_title)
            and match_company == normalize_text(other.company_name)
            and match_location == normalize_text(other.location_text)
        ):
            duplicate_reasons.append(
                "Same company, title, and location as another vacancy match."
            )
            return _DedupResult(
                duplicate_status="possible_duplicate",
                duplicate_of_match_id=other.id,
                duplicate_application_id=None,
                duplicate_reasons=duplicate_reasons,
            )

    app_duplicate = _detect_application_duplicate(
        match_url=match_url,
        match_title=match_title,
        match_company=match_company,
        applications=applications,
    )
    if app_duplicate is not None:
        return app_duplicate

    if match.application_id is not None:
        return _DedupResult(
            duplicate_status="likely_duplicate",
            duplicate_of_match_id=None,
            duplicate_application_id=match.application_id,
            duplicate_reasons=["Vacancy match is already linked to an application."],
        )

    return _DedupResult(
        duplicate_status="none",
        duplicate_of_match_id=None,
        duplicate_application_id=None,
        duplicate_reasons=[],
    )


def _detect_application_duplicate(
    *,
    match_url: str,
    match_title: str,
    match_company: str,
    applications: list[Application],
) -> _DedupResult | None:
    for app in applications:
        if match_url and match_url == normalize_url(app.vacancy_url):
            return _DedupResult(
                duplicate_status="exact_duplicate",
                duplicate_of_match_id=None,
                duplicate_application_id=app.id,
                duplicate_reasons=["Same normalized source URL as an existing application."],
            )
        if (
            match_title
            and match_company
            and match_title == normalize_text(app.role_title)
            and match_company == normalize_text(app.company_name)
        ):
            return _DedupResult(
                duplicate_status="possible_duplicate",
                duplicate_of_match_id=None,
                duplicate_application_id=app.id,
                duplicate_reasons=["Same company and title as an existing application."],
            )
    return None
