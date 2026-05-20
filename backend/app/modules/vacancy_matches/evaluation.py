from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit
from uuid import UUID

from app.db.models.application import Application
from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_matches.schemas import VacancyMatchEvaluationResponse

_WORD_RE = re.compile(r"[a-z0-9а-яё]+", re.IGNORECASE)
_TRACKING_QUERY_PREFIXES = ("utm_",)
_TRACKING_QUERY_KEYS = {"fbclid", "gclid", "yclid"}


@dataclass(frozen=True)
class _ScoreResult:
    total_score: int
    title_match_score: int
    location_match_score: int
    employment_type_match_score: int
    work_mode_match_score: int
    keyword_score: int
    excluded_keyword_penalty: int
    source_score: int
    reasons: list[str]
    penalties: list[str]


@dataclass(frozen=True)
class _DedupResult:
    duplicate_status: str
    duplicate_of_match_id: UUID | None
    duplicate_application_id: UUID | None
    duplicate_reasons: list[str]


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(_WORD_RE.findall(value.casefold()))


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
    score = _score_match(match, loop)
    dedup = _detect_duplicate(match, existing_matches, applications)
    return VacancyMatchEvaluationResponse(
        match_id=match.id,
        loop_id=match.loop_id,
        total_score=score.total_score,
        title_match_score=score.title_match_score,
        location_match_score=score.location_match_score,
        employment_type_match_score=score.employment_type_match_score,
        work_mode_match_score=score.work_mode_match_score,
        keyword_score=score.keyword_score,
        excluded_keyword_penalty=score.excluded_keyword_penalty,
        source_score=score.source_score,
        reasons=score.reasons,
        penalties=score.penalties,
        duplicate_status=dedup.duplicate_status,
        duplicate_of_match_id=dedup.duplicate_of_match_id,
        duplicate_application_id=dedup.duplicate_application_id,
        duplicate_reasons=dedup.duplicate_reasons,
    )


def _score_match(match: VacancyMatch, loop: Loop) -> _ScoreResult:
    reasons: list[str] = []
    penalties: list[str] = []
    searchable = normalize_text(
        " ".join(
            item
            for item in (
                match.role_title,
                match.company_name,
                match.location_text,
                match.vacancy_description,
            )
            if item
        )
    )

    title_match_score = _title_score(match, loop, reasons)
    location_match_score = _location_score(match, loop, reasons)
    keyword_score = _keyword_score(searchable, loop, reasons)
    excluded_keyword_penalty = _excluded_keyword_penalty(searchable, loop, penalties)
    source_score = _source_score(match, loop, reasons, penalties)

    total = (
        title_match_score
        + location_match_score
        + keyword_score
        + source_score
        - excluded_keyword_penalty
    )
    total_score = max(0, min(100, total))

    if not penalties:
        reasons.append("No excluded keywords found.")

    return _ScoreResult(
        total_score=total_score,
        title_match_score=title_match_score,
        location_match_score=location_match_score,
        employment_type_match_score=0,
        work_mode_match_score=0,
        keyword_score=keyword_score,
        excluded_keyword_penalty=excluded_keyword_penalty,
        source_score=source_score,
        reasons=reasons,
        penalties=penalties,
    )


def _title_score(match: VacancyMatch, loop: Loop, reasons: list[str]) -> int:
    match_title = normalize_text(match.role_title)
    target_role = normalize_text(loop.target_role)
    if not match_title or not target_role:
        return 0
    target_tokens = set(target_role.split())
    title_tokens = set(match_title.split())
    if not target_tokens:
        return 0
    overlap = target_tokens & title_tokens
    if not overlap:
        return 0
    score = 25 if len(overlap) == len(target_tokens) else 15
    reasons.append(f"Role title matches Loop target terms: {', '.join(sorted(overlap))}.")
    return score


def _location_score(match: VacancyMatch, loop: Loop, reasons: list[str]) -> int:
    match_location = normalize_text(match.location_text)
    loop_location = normalize_text(loop.location)
    if not match_location or not loop_location:
        return 0
    if loop_location in match_location or match_location in loop_location:
        reasons.append("Location matches Loop location.")
        return 10
    return 0


def _keyword_score(searchable: str, loop: Loop, reasons: list[str]) -> int:
    score = 0
    for keyword in loop.keywords or []:
        normalized = normalize_text(str(keyword))
        if normalized and normalized in searchable:
            score += 10
            reasons.append(f"Matched keyword: {keyword}.")
    return min(score, 30)


def _excluded_keyword_penalty(searchable: str, loop: Loop, penalties: list[str]) -> int:
    penalty = 0
    for keyword in loop.excluded_keywords or []:
        normalized = normalize_text(str(keyword))
        if normalized and normalized in searchable:
            penalty += 15
            penalties.append(f"Matched excluded keyword: {keyword}.")
    return min(penalty, 30)


def _source_score(
    match: VacancyMatch,
    loop: Loop,
    reasons: list[str],
    penalties: list[str],
) -> int:
    selected = {normalize_text(str(source)) for source in loop.selected_sources or []}
    source = normalize_text(match.source)
    if not source or not selected:
        return 0
    if source in selected:
        reasons.append("Source is selected for this Loop.")
        return 15
    penalties.append("Source is not selected for this Loop.")
    return 0


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
