"""Tests for the unified preview scoring on the discovery feed (Stage 6c).

Previews are scored by the SAME core as persisted matches
(``vacancy_matches/scoring.py``); the legacy 0–1 relevance heuristic is gone.
``confidence["score"]`` carries the unified 0–100 value, while
``confidence["relevance"]`` and ``insight.score`` remain on the 0–1 scale
(= score / 100) for the current frontend badge until Stage 6d.
"""

from __future__ import annotations

from types import SimpleNamespace

from app.modules.discovery_runs.schemas import (
    DiscoveryRunItem,
    DiscoveryRunPreviewItem,
)
from app.modules.discovery_runs.service import (
    DiscoveryRunsService,
    build_preview_insight,
    loop_insight_terms,
)
from app.modules.vacancy_matches.scoring import ScoreInput, score_match


def _preview(**overrides) -> DiscoveryRunPreviewItem:
    data = {
        "external_id": "job-1",
        "source_url": "https://example.com/jobs/1",
        "title": "Frontend Developer",
        "company": "Acme GmbH",
        "snippet": "React role.",
        "location": "Berlin",
        "confidence": {"source_quality": 0.7},
    }
    data.update(overrides)
    return DiscoveryRunPreviewItem(**data)


def _item(previews: list[DiscoveryRunPreviewItem]) -> DiscoveryRunItem:
    return DiscoveryRunItem(
        loop_id="loop-1",
        source_id="arbeitsagentur",
        status="would_run",
        reason="adapter_preview_ready",
        message="ok",
        items_previewed=len(previews),
        preview_items=previews,
    )


def _loop(**overrides):
    data = {
        "target_role": "Frontend Developer",
        "keywords": [],
        "location": "Berlin",
    }
    data.update(overrides)
    return SimpleNamespace(**data)


# ── loop_insight_terms ───────────────────────────────────────────────────────


def test_terms_split_role_words_and_merge_keywords():
    terms = loop_insight_terms(
        _loop(target_role="Senior Frontend Developer", keywords=["React", "a"])
    )
    # senior + frontend + developer + react ("a" is too short and dropped)
    assert terms == ["Senior", "Frontend", "Developer", "React"]


def test_terms_dedupe_case_insensitively():
    terms = loop_insight_terms(
        _loop(target_role="Developer", keywords=["developer", "DEVELOPER"])
    )
    assert terms == ["Developer"]


# ── build_preview_insight ────────────────────────────────────────────────────


def _score_preview(preview: DiscoveryRunPreviewItem, loop, source_id="arbeitsagentur"):
    return score_match(
        loop,
        ScoreInput(
            role_title=preview.title,
            company_name=preview.company,
            location_text=preview.location,
            description=preview.snippet,
            source=source_id,
        ),
    )


def test_insight_reports_matched_and_missing_terms():
    loop = _loop(target_role="Frontend Developer", keywords=["React", "TypeScript"])
    preview = _preview(title="Frontend Developer", snippet="React role.")

    insight = build_preview_insight(loop, _score_preview(preview, loop))

    # frontend + developer (title overlap) + react (keyword) matched;
    # typescript missing.
    assert set(insight.matched) == {"Frontend", "Developer", "React"}
    assert insight.missing == ["TypeScript"]
    # 0–1 scale for the current frontend badge.
    assert 0.0 < insight.score <= 1.0


def test_insight_score_mirrors_unified_total():
    loop = _loop()
    preview = _preview(title="Frontend Developer", location="Berlin")
    result = _score_preview(preview, loop)

    insight = build_preview_insight(loop, result)

    # full title overlap (25) + location (10), no selected sources on the stub.
    assert result.total == 35
    assert insight.score == 0.35


# ── DiscoveryRunsService._rank_preview_items ─────────────────────────────────


def test_rank_attaches_insight_and_both_score_scales():
    item = _item([_preview(title="Frontend Developer", snippet="React role.")])

    ranked = DiscoveryRunsService._rank_preview_items(
        item, _loop(keywords=["React", "Vue"])
    )

    top = ranked.preview_items[0]
    assert top.insight is not None
    assert "Frontend" in top.insight.matched
    assert "Vue" in top.insight.missing
    # title 25 + location 10 + keyword react 10 = 45 (stub has no sources).
    assert top.confidence["score"] == 45.0
    assert top.confidence["relevance"] == 0.45  # deprecated 0–1 mirror
    assert top.insight.score == top.confidence["relevance"]


def test_rank_orders_best_first_and_preserves_other_confidence():
    weak = _preview(external_id="weak", title="React Engineer", snippet="pipes")
    strong = _preview(external_id="strong", title="Frontend Developer")
    item = _item([weak, strong])

    ranked = DiscoveryRunsService._rank_preview_items(item, _loop())

    assert [p.external_id for p in ranked.preview_items] == ["strong", "weak"]
    top = ranked.preview_items[0]
    assert top.confidence["score"] > ranked.preview_items[1].confidence["score"]
    # annotation must not clobber adapter-provided confidence keys
    assert top.confidence["source_quality"] == 0.7


def test_rank_is_stable_for_equal_scores():
    a = _preview(external_id="a", title="Frontend Developer")
    b = _preview(external_id="b", title="Frontend Developer")
    item = _item([a, b])

    ranked = DiscoveryRunsService._rank_preview_items(item, _loop())

    assert [p.external_id for p in ranked.preview_items] == ["a", "b"]


def test_rank_annotates_zero_scores_without_signals():
    # Even a loop with no role/keywords/location gets consistent annotations
    # (score 0) instead of silently skipping — order stays stable.
    item = _item([_preview(external_id="a"), _preview(external_id="b")])
    loop = _loop(target_role=None, keywords=[], location=None)

    ranked = DiscoveryRunsService._rank_preview_items(item, loop)

    assert [p.external_id for p in ranked.preview_items] == ["a", "b"]
    assert all(p.confidence["score"] == 0.0 for p in ranked.preview_items)
    assert all(p.confidence["relevance"] == 0.0 for p in ranked.preview_items)
