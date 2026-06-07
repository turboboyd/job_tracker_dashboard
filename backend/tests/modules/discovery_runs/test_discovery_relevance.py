from __future__ import annotations

from types import SimpleNamespace

from app.modules.discovery_runs.schemas import (
    DiscoveryRunItem,
    DiscoveryRunPreviewItem,
)
from app.modules.discovery_runs.service import (
    DiscoveryRunsService,
    analyze_preview_relevance,
    build_relevance_matchers,
    score_preview_relevance,
)


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


# ── build_relevance_matchers ─────────────────────────────────────────────────


def test_matchers_split_role_words_and_merge_keywords():
    matchers = build_relevance_matchers(
        _loop(target_role="Senior Frontend Developer", keywords=["React", "a"])
    )
    # senior + frontend + developer + react ("a" is too short and dropped)
    assert len(matchers) == 4


def test_matchers_dedupe_case_insensitively():
    matchers = build_relevance_matchers(
        _loop(target_role="Developer", keywords=["developer", "DEVELOPER"])
    )
    assert len(matchers) == 1


# ── score_preview_relevance ──────────────────────────────────────────────────


def test_full_title_coverage_plus_location_scores_one():
    matchers = build_relevance_matchers(_loop(target_role="Frontend Developer"))
    score = score_preview_relevance(
        _preview(title="Frontend Developer", location="Berlin"), matchers, "berlin"
    )
    # 0.85 (full coverage) + 0.15 (location) == 1.0
    assert score == 1.0


def test_snippet_only_match_scores_low():
    matchers = build_relevance_matchers(_loop(target_role="Frontend Developer"))
    score = score_preview_relevance(
        _preview(title="React Engineer", snippet="frontend role", location="Munich"),
        matchers,
        "berlin",
    )
    # one of two terms in snippet only: 0.85 * (0.3 / 2) ≈ 0.128, no location bonus
    assert 0.0 < score < 0.2


def test_no_signal_scores_zero():
    matchers = build_relevance_matchers(_loop(target_role="Frontend Developer"))
    score = score_preview_relevance(
        _preview(title="Plumber", snippet="pipes", location="Munich"),
        matchers,
        "berlin",
    )
    assert score == 0.0


# ── analyze_preview_relevance (heuristic feed insight) ───────────────────────


def test_insight_reports_matched_and_missing_terms():
    matchers = build_relevance_matchers(
        _loop(target_role="Frontend Developer", keywords=["React", "TypeScript"])
    )
    insight = analyze_preview_relevance(
        _preview(title="Frontend Developer", snippet="React role.", location="Berlin"),
        matchers,
        "berlin",
    )
    # frontend + developer (title) + react (snippet) matched; typescript missing
    assert set(insight.matched) == {"Frontend", "Developer", "React"}
    assert insight.missing == ["TypeScript"]
    assert insight.score > 0.0


def test_insight_no_matchers_is_empty_but_scored_by_location():
    insight = analyze_preview_relevance(
        _preview(location="Berlin"), [], "berlin"
    )
    assert insight.matched == []
    assert insight.missing == []
    assert insight.score == 0.15  # location bonus only


# ── DiscoveryRunsService._rank_preview_items ─────────────────────────────────


def test_rank_attaches_insight_to_each_preview():
    item = _item([_preview(title="Frontend Developer", snippet="React role.")])

    ranked = DiscoveryRunsService._rank_preview_items(
        item, _loop(keywords=["React", "Vue"])
    )

    insight = ranked.preview_items[0].insight
    assert insight is not None
    assert "Frontend" in insight.matched
    assert "Vue" in insight.missing
    assert insight.score == ranked.preview_items[0].confidence["relevance"]


def test_rank_orders_best_first_and_annotates_relevance():
    weak = _preview(external_id="weak", title="React Engineer", snippet="pipes")
    strong = _preview(external_id="strong", title="Frontend Developer")
    item = _item([weak, strong])

    ranked = DiscoveryRunsService._rank_preview_items(item, _loop())

    assert [p.external_id for p in ranked.preview_items] == ["strong", "weak"]
    # relevance annotated without clobbering source_quality
    top = ranked.preview_items[0]
    assert top.confidence["relevance"] > ranked.preview_items[1].confidence["relevance"]
    assert top.confidence["source_quality"] == 0.7


def test_rank_is_stable_for_equal_scores():
    a = _preview(external_id="a", title="Frontend Developer")
    b = _preview(external_id="b", title="Frontend Developer")
    item = _item([a, b])

    ranked = DiscoveryRunsService._rank_preview_items(item, _loop())

    assert [p.external_id for p in ranked.preview_items] == ["a", "b"]


def test_rank_no_op_without_role_or_location():
    item = _item([_preview(external_id="a"), _preview(external_id="b")])
    loop = _loop(target_role=None, keywords=[], location=None)

    ranked = DiscoveryRunsService._rank_preview_items(item, loop)

    assert ranked is item
