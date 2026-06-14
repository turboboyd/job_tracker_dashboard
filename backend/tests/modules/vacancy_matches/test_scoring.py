"""Unit tests for the Stage 6c scoring core (vacancy_matches/scoring.py).

The parity block embeds the pre-6c scorer (copied verbatim from the legacy
``evaluation._score_match``) as a reference implementation and asserts the new
core produces identical totals and component values for a matrix of inputs —
the hard Stage 6c stop-condition.
"""

from __future__ import annotations

import re
from types import SimpleNamespace

from app.modules.vacancy_matches.scoring import (
    SCORE_VERSION,
    ScoreInput,
    apply_score,
    normalize_text,
    render_penalty,
    render_reason,
    score_input_from_match,
    score_match,
)

# ── Legacy reference implementation (pre-6c evaluation._score_match) ──────────

_WORD_RE = re.compile(r"[a-z0-9а-яё]+", re.IGNORECASE)


def _legacy_normalize(value):
    if not value:
        return ""
    return " ".join(_WORD_RE.findall(value.casefold()))


def _legacy_score(match, loop):
    """Verbatim port of the legacy scorer. Returns (total, components, reasons,
    penalties) with the original English strings."""
    reasons: list[str] = []
    penalties: list[str] = []
    searchable = _legacy_normalize(
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

    # title
    title_score = 0
    match_title = _legacy_normalize(match.role_title)
    target_role = _legacy_normalize(loop.target_role)
    if match_title and target_role:
        target_tokens = set(target_role.split())
        title_tokens = set(match_title.split())
        if target_tokens:
            overlap = target_tokens & title_tokens
            if overlap:
                title_score = 25 if len(overlap) == len(target_tokens) else 15
                reasons.append(
                    f"Role title matches Loop target terms: {', '.join(sorted(overlap))}."
                )

    # location
    location_score = 0
    match_location = _legacy_normalize(match.location_text)
    loop_location = _legacy_normalize(loop.location)
    if match_location and loop_location and (
        loop_location in match_location or match_location in loop_location
    ):
        reasons.append("Location matches Loop location.")
        location_score = 10

    # keywords
    keyword_score = 0
    for keyword in loop.keywords or []:
        normalized = _legacy_normalize(str(keyword))
        if normalized and normalized in searchable:
            keyword_score += 10
            reasons.append(f"Matched keyword: {keyword}.")
    keyword_score = min(keyword_score, 30)

    # excluded keywords
    penalty = 0
    for keyword in loop.excluded_keywords or []:
        normalized = _legacy_normalize(str(keyword))
        if normalized and normalized in searchable:
            penalty += 15
            penalties.append(f"Matched excluded keyword: {keyword}.")
    penalty = min(penalty, 30)

    # source
    source_score = 0
    selected = {_legacy_normalize(str(s)) for s in loop.selected_sources or []}
    source = _legacy_normalize(match.source)
    if source and selected:
        if source in selected:
            reasons.append("Source is selected for this Loop.")
            source_score = 15
        else:
            penalties.append("Source is not selected for this Loop.")

    total = max(
        0, min(100, title_score + location_score + keyword_score + source_score - penalty)
    )
    if not penalties:
        reasons.append("No excluded keywords found.")
    return total, {
        "title": title_score,
        "location": location_score,
        "keywords": keyword_score,
        "source": source_score,
        "excluded_penalty": penalty,
    }, reasons, penalties


# ── Fixtures ──────────────────────────────────────────────────────────────────


def _loop(**overrides):
    base = {
        "target_role": "Frontend Developer",
        "location": "Berlin",
        "keywords": ["react", "typescript"],
        "excluded_keywords": ["senior"],
        "selected_sources": ["arbeitsagentur", "remotive"],
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def _match(**overrides):
    base = {
        "role_title": "Frontend Developer",
        "company_name": "Acme",
        "location_text": "Berlin",
        "vacancy_description": "We use react and typescript.",
        "source": "arbeitsagentur",
    }
    base.update(overrides)
    return SimpleNamespace(**base)


def _score_input(match) -> ScoreInput:
    return ScoreInput(
        role_title=match.role_title,
        company_name=match.company_name,
        location_text=match.location_text,
        description=match.vacancy_description,
        source=match.source,
    )


# ── Parity with the legacy scorer ─────────────────────────────────────────────

_PARITY_CASES = [
    (_loop(), _match()),  # everything matches, capped keywords
    (_loop(), _match(role_title="React Engineer")),  # no title overlap
    (_loop(), _match(role_title="Senior Frontend Engineer")),  # partial + excluded hit
    (_loop(), _match(location_text="Hamburg")),  # location miss
    (_loop(), _match(source="linkedin")),  # source not selected → penalty path
    (_loop(), _match(source=None)),  # no source
    (_loop(selected_sources=[]), _match()),  # no selected sources
    (_loop(target_role=None), _match()),  # no target role
    (_loop(keywords=["react", "python", "sales", "go"]), _match()),  # keyword cap
    (
        _loop(excluded_keywords=["acme", "react", "berlin"]),
        _match(),
    ),  # excluded cap (3×15 → 30)
    (_loop(), _match(role_title=None, vacancy_description=None)),  # sparse vacancy
    (
        _loop(target_role="Разработчик Python", location="Берлин", keywords=["удалённо"]),
        _match(
            role_title="Python Разработчик",
            location_text="Берлин, Германия",
            vacancy_description="Работа удалённо",
        ),
    ),  # cyrillic normalization
]


def test_parity_with_legacy_scorer():
    for loop, match in _PARITY_CASES:
        legacy_total, legacy_components, legacy_reasons, legacy_penalties = (
            _legacy_score(match, loop)
        )
        result = score_match(loop, _score_input(match))

        assert result.total == legacy_total, (loop, match)
        assert result.components == legacy_components, (loop, match)
        # Rendered strings must be byte-identical to the legacy API output.
        assert [render_reason(r) for r in result.reasons] == legacy_reasons
        assert [render_penalty(p) for p in result.penalties] == legacy_penalties


# ── Determinism & versioning ──────────────────────────────────────────────────


def test_score_is_deterministic_and_versioned():
    loop, match = _loop(), _match()
    first = score_match(loop, _score_input(match))
    second = score_match(loop, _score_input(match))
    assert first == second
    assert first.version == SCORE_VERSION == 1


def test_total_is_clamped_to_0_100():
    # Heavy penalties cannot push the total below zero.
    loop = _loop(
        target_role=None,
        location=None,
        keywords=[],
        excluded_keywords=["acme", "berlin"],
        selected_sources=["other"],
    )
    result = score_match(loop, _score_input(_match()))
    assert result.total == 0
    assert result.components["excluded_penalty"] == 30


# ── Coded reasons ─────────────────────────────────────────────────────────────


def test_reason_codes_carry_terms():
    result = score_match(_loop(), _score_input(_match()))
    codes = {reason.code for reason in result.reasons}
    assert {"title_match", "location_match", "keyword_matched", "source_selected"} <= codes

    title = next(r for r in result.reasons if r.code == "title_match")
    assert title.terms == ["developer", "frontend"]  # sorted overlap tokens

    keywords = [r.terms[0] for r in result.reasons if r.code == "keyword_matched"]
    assert keywords == ["react", "typescript"]


def test_penalty_codes():
    result = score_match(_loop(), _score_input(_match(source="linkedin")))
    assert [p.code for p in result.penalties] == ["source_not_selected"]

    result = score_match(
        _loop(), _score_input(_match(vacancy_description="senior role"))
    )
    assert any(p.code == "excluded_keyword" and p.terms == ["senior"] for p in result.penalties)


def test_clean_reason_only_when_no_penalties():
    clean = score_match(_loop(), _score_input(_match()))
    assert clean.reasons[-1].code == "no_excluded_keywords"

    # Legacy quirk preserved: ANY penalty (here source) suppresses the clean reason.
    dirty = score_match(_loop(), _score_input(_match(source="linkedin")))
    assert all(r.code != "no_excluded_keywords" for r in dirty.reasons)


# ── Preview-style input & helpers ─────────────────────────────────────────────


def test_preview_input_without_description():
    # Previews score with snippet=None just fine; only the searchable blob shrinks.
    result = score_match(
        _loop(),
        ScoreInput(role_title="Frontend Developer", source="arbeitsagentur"),
    )
    assert result.components["title"] == 25
    assert result.components["source"] == 15
    assert result.components["location"] == 0


def test_apply_score_stamps_match_fields():
    match = SimpleNamespace(score=None, score_version=None, score_details=None)
    result = score_match(_loop(), _score_input(_match()))
    apply_score(match, result)
    assert match.score == result.total
    assert match.score_version == SCORE_VERSION
    assert match.score_details == result.details_dict()
    assert set(match.score_details) == {"components", "reasons", "penalties"}


def test_score_input_from_match_maps_fields():
    match = SimpleNamespace(
        role_title="t",
        company_name="c",
        location_text="l",
        vacancy_description="d",
        source="s",
    )
    data = score_input_from_match(match)
    assert (data.role_title, data.company_name, data.location_text) == ("t", "c", "l")
    assert (data.description, data.source) == ("d", "s")


def test_normalize_text_reexported_behaviour():
    assert normalize_text("  Senior Python-Engineer! ") == "senior python engineer"
