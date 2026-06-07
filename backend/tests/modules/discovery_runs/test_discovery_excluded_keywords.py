from __future__ import annotations

from types import SimpleNamespace

from app.modules.discovery_runs.schemas import (
    DiscoveryRunItem,
    DiscoveryRunPreviewItem,
)
from app.modules.discovery_runs.service import (
    DiscoveryRunsService,
    build_excluded_keyword_matchers,
    preview_matches_excluded,
)


def _preview(**overrides) -> DiscoveryRunPreviewItem:
    data = {
        "external_id": "job-1",
        "source_url": "https://example.com/jobs/1",
        "title": "Frontend Developer",
        "company": "Acme GmbH",
        "snippet": "React role.",
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


def _loop(excluded_keywords):
    return SimpleNamespace(excluded_keywords=excluded_keywords)


# ── build_excluded_keyword_matchers ──────────────────────────────────────────


def test_matchers_ignore_blank_and_duplicate_keywords():
    matchers = build_excluded_keyword_matchers(["java", "  java  ", "", "  ", "QA"])
    assert len(matchers) == 2  # "java" (deduped, case-insensitive) + "QA"


def test_matchers_are_none_safe():
    assert build_excluded_keyword_matchers(None) == []
    assert build_excluded_keyword_matchers([]) == []


# ── preview_matches_excluded (whole-word) ────────────────────────────────────


def test_whole_word_match_does_not_overreach():
    matchers = build_excluded_keyword_matchers(["java"])
    # "java" must match "Java" but NOT "JavaScript".
    assert preview_matches_excluded(_preview(title="Java Engineer"), matchers) is True
    assert (
        preview_matches_excluded(_preview(title="JavaScript Engineer"), matchers)
        is False
    )


def test_match_scans_company_and_snippet_too():
    matchers = build_excluded_keyword_matchers(["recruiting"])
    assert (
        preview_matches_excluded(
            _preview(title="Developer", company="Acme Recruiting", snippet=None),
            matchers,
        )
        is True
    )
    assert (
        preview_matches_excluded(
            _preview(title="Developer", company="Acme", snippet="staffing role"),
            matchers,
        )
        is False
    )


def test_multiword_excluded_phrase_matches():
    matchers = build_excluded_keyword_matchers(["project manager"])
    assert (
        preview_matches_excluded(_preview(title="Senior Project Manager"), matchers)
        is True
    )


# ── DiscoveryRunsService._filter_excluded_keywords ───────────────────────────


def test_filter_drops_excluded_and_updates_count():
    item = _item(
        [
            _preview(external_id="a", title="Java Developer"),
            _preview(external_id="b", title="Frontend Developer"),
        ]
    )
    filtered = DiscoveryRunsService._filter_excluded_keywords(item, _loop(["java"]))
    assert filtered.items_previewed == 1
    assert [p.external_id for p in filtered.preview_items] == ["b"]


def test_filter_returns_same_item_when_no_keywords():
    item = _item([_preview(title="Java Developer")])
    filtered = DiscoveryRunsService._filter_excluded_keywords(item, _loop([]))
    assert filtered is item


def test_filter_returns_same_item_when_nothing_excluded():
    item = _item([_preview(title="Frontend Developer")])
    filtered = DiscoveryRunsService._filter_excluded_keywords(item, _loop(["java"]))
    assert filtered is item
