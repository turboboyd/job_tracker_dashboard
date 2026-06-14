"""Match scoring core — the single owner of "how well does a vacancy fit a loop".

Design (Stage 6c, ADR pending):
- One deterministic, versioned, explainable scorer for BOTH persisted
  ``VacancyMatch`` rows and not-yet-saved discovery previews. The two surfaces
  previously used different heuristics (``evaluation._score_match`` 0–100 vs the
  discovery relevance 0–1); this module replaces both with one formula.
- v1 weights are byte-identical to the legacy ``evaluation._score_match`` so the
  evaluate endpoint's numbers do not change (parity is enforced by
  ``tests/modules/vacancy_matches/test_scoring.py``):
    title    0 / 15 / 25   (partial / full target-role token overlap)
    location 0 / 10        (substring containment either way)
    keywords +10 each, capped at 30
    source   0 / 15        (vacancy source is in the loop's selected sources)
    excluded −15 each, capped at 30 (penalty)
    total = clamp(0, 100)
- Reasons/penalties are machine-readable codes (the frontend localizes codes,
  not English strings). ``render_reason``/``render_penalty`` reproduce the exact
  legacy English strings for the backward-compatible evaluate response.
- The result is persisted on ``vacancy_matches`` (``score``, ``score_version``,
  ``score_details``) so lists can sort by score server-side. Bump SCORE_VERSION
  whenever the formula changes so stale rows are identifiable.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import Protocol

SCORE_VERSION = 1

_WORD_RE = re.compile(r"[a-z0-9а-яё]+", re.IGNORECASE)

# Component caps (kept identical to the legacy scorer).
_TITLE_FULL = 25
_TITLE_PARTIAL = 15
_LOCATION_BONUS = 10
_KEYWORD_EACH = 10
_KEYWORD_CAP = 30
_SOURCE_BONUS = 15
_EXCLUDED_EACH = 15
_EXCLUDED_CAP = 30


def normalize_text(value: str | None) -> str:
    if not value:
        return ""
    return " ".join(_WORD_RE.findall(value.casefold()))


class LoopLike(Protocol):
    """The loop fields scoring reads. Satisfied by the ORM ``Loop`` model and by
    lightweight stubs in tests/seed."""

    target_role: str | None
    location: str | None
    keywords: list | None
    excluded_keywords: list | None
    selected_sources: list | None


@dataclass(frozen=True)
class ScoreInput:
    """Vacancy-side scoring signals.

    Works for persisted matches (``description`` = ``vacancy_description``) and
    for discovery previews (``description`` = snippet) alike.
    """

    role_title: str | None = None
    company_name: str | None = None
    location_text: str | None = None
    description: str | None = None
    source: str | None = None


@dataclass(frozen=True)
class ScoreReason:
    """A machine-readable explanation entry. ``terms`` carries the matched
    tokens/keywords where applicable (empty for boolean facts)."""

    code: str
    terms: list[str] = field(default_factory=list)

    def as_dict(self) -> dict:
        return {"code": self.code, "terms": list(self.terms)}


@dataclass(frozen=True)
class ScoreResult:
    total: int
    components: dict[str, int]
    reasons: list[ScoreReason]
    penalties: list[ScoreReason]
    version: int = SCORE_VERSION

    def details_dict(self) -> dict:
        """JSON-serialisable payload for the ``score_details`` column."""
        return {
            "components": dict(self.components),
            "reasons": [reason.as_dict() for reason in self.reasons],
            "penalties": [penalty.as_dict() for penalty in self.penalties],
        }


def score_input_from_match(match) -> ScoreInput:  # noqa: ANN001 - VacancyMatch or preview-like
    """Build a ``ScoreInput`` from a persisted ``VacancyMatch`` row."""
    return ScoreInput(
        role_title=match.role_title,
        company_name=match.company_name,
        location_text=match.location_text,
        description=match.vacancy_description,
        source=match.source,
    )


def score_match(loop: LoopLike, data: ScoreInput) -> ScoreResult:
    """Deterministic v1 score. Weights mirror the legacy evaluator exactly."""
    reasons: list[ScoreReason] = []
    penalties: list[ScoreReason] = []

    searchable = normalize_text(
        " ".join(
            item
            for item in (
                data.role_title,
                data.company_name,
                data.location_text,
                data.description,
            )
            if item
        )
    )

    title = _title_score(data, loop, reasons)
    location = _location_score(data, loop, reasons)
    keywords = _keyword_score(searchable, loop, reasons)
    excluded_penalty = _excluded_keyword_penalty(searchable, loop, penalties)
    source = _source_score(data, loop, reasons, penalties)

    total = max(0, min(100, title + location + keywords + source - excluded_penalty))

    # Legacy quirk preserved for parity: the "clean" reason is appended only
    # when there are NO penalties at all (including the source-not-selected
    # penalty), not merely when no excluded keyword matched.
    if not penalties:
        reasons.append(ScoreReason(code="no_excluded_keywords"))

    return ScoreResult(
        total=total,
        components={
            "title": title,
            "location": location,
            "keywords": keywords,
            "source": source,
            "excluded_penalty": excluded_penalty,
        },
        reasons=reasons,
        penalties=penalties,
    )


def _title_score(data: ScoreInput, loop: LoopLike, reasons: list[ScoreReason]) -> int:
    match_title = normalize_text(data.role_title)
    target_role = normalize_text(getattr(loop, "target_role", None))
    if not match_title or not target_role:
        return 0
    target_tokens = set(target_role.split())
    title_tokens = set(match_title.split())
    if not target_tokens:
        return 0
    overlap = target_tokens & title_tokens
    if not overlap:
        return 0
    score = _TITLE_FULL if len(overlap) == len(target_tokens) else _TITLE_PARTIAL
    reasons.append(ScoreReason(code="title_match", terms=sorted(overlap)))
    return score


def _location_score(data: ScoreInput, loop: LoopLike, reasons: list[ScoreReason]) -> int:
    match_location = normalize_text(data.location_text)
    loop_location = normalize_text(getattr(loop, "location", None))
    if not match_location or not loop_location:
        return 0
    if loop_location in match_location or match_location in loop_location:
        reasons.append(ScoreReason(code="location_match"))
        return _LOCATION_BONUS
    return 0


def _keyword_score(searchable: str, loop: LoopLike, reasons: list[ScoreReason]) -> int:
    score = 0
    for keyword in getattr(loop, "keywords", None) or []:
        normalized = normalize_text(str(keyword))
        if normalized and normalized in searchable:
            score += _KEYWORD_EACH
            reasons.append(ScoreReason(code="keyword_matched", terms=[str(keyword)]))
    return min(score, _KEYWORD_CAP)


def _excluded_keyword_penalty(
    searchable: str, loop: LoopLike, penalties: list[ScoreReason]
) -> int:
    penalty = 0
    for keyword in getattr(loop, "excluded_keywords", None) or []:
        normalized = normalize_text(str(keyword))
        if normalized and normalized in searchable:
            penalty += _EXCLUDED_EACH
            penalties.append(ScoreReason(code="excluded_keyword", terms=[str(keyword)]))
    return min(penalty, _EXCLUDED_CAP)


def _source_score(
    data: ScoreInput,
    loop: LoopLike,
    reasons: list[ScoreReason],
    penalties: list[ScoreReason],
) -> int:
    selected = {
        normalize_text(str(source))
        for source in getattr(loop, "selected_sources", None) or []
    }
    source = normalize_text(data.source)
    if not source or not selected:
        return 0
    if source in selected:
        reasons.append(ScoreReason(code="source_selected"))
        return _SOURCE_BONUS
    penalties.append(ScoreReason(code="source_not_selected"))
    return 0


# ── Legacy string rendering (back-compat for the evaluate response) ────────────
# These reproduce the exact English strings the API has always returned, so
# existing clients (incl. the current frontend's prefix-matching localization)
# keep working until they migrate to codes.


def render_reason(reason: ScoreReason) -> str:
    if reason.code == "title_match":
        return f"Role title matches Loop target terms: {', '.join(reason.terms)}."
    if reason.code == "keyword_matched":
        return f"Matched keyword: {reason.terms[0]}."
    if reason.code == "location_match":
        return "Location matches Loop location."
    if reason.code == "source_selected":
        return "Source is selected for this Loop."
    if reason.code == "no_excluded_keywords":
        return "No excluded keywords found."
    return reason.code


def render_penalty(penalty: ScoreReason) -> str:
    if penalty.code == "excluded_keyword":
        return f"Matched excluded keyword: {penalty.terms[0]}."
    if penalty.code == "source_not_selected":
        return "Source is not selected for this Loop."
    return penalty.code


def apply_score(match, result: ScoreResult) -> None:  # noqa: ANN001 - VacancyMatch
    """Stamp a score onto a ``VacancyMatch`` instance (no flush/commit here)."""
    match.score = result.total
    match.score_version = result.version
    match.score_details = result.details_dict()
