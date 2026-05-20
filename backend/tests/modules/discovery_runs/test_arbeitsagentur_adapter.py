from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.arbeitsagentur import (
    ARBEITSAGENTUR_PUBLIC_CLIENT_ID,
    ArbeitsagenturAdapter,
    build_arbeitsagentur_query_candidates,
    build_arbeitsagentur_query,
    build_arbeitsagentur_search_terms,
    map_arbeitsagentur_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {
        "target_role": "Backend Engineer",
        "keywords": ["Python", "FastAPI"],
        "location": "Berlin",
        "radius_km": 50,
        "discovery_radius_km": 25,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_arbeitsagentur_adapter_builds_safe_query_from_loop() -> None:
    query = build_arbeitsagentur_query(
        make_loop(),
        options=DiscoveryAdapterOptions(max_results=5),
    )

    assert query == {
        "page": "1",
        "size": "5",
        "pav": "false",
        "angebotsart": "1",
        "was": "Backend Engineer Python FastAPI",
        "wo": "Berlin",
        "umkreis": "25",
    }


def test_arbeitsagentur_adapter_limits_query_size() -> None:
    query = build_arbeitsagentur_query(
        make_loop(),
        options=DiscoveryAdapterOptions(max_results=5),
    )

    assert query["size"] == "5"


def test_arbeitsagentur_adapter_uses_requested_page() -> None:
    query = build_arbeitsagentur_query(
        make_loop(),
        options=DiscoveryAdapterOptions(page=3, page_size=5, max_results=5),
    )

    assert query["page"] == "3"


def test_arbeitsagentur_adapter_broad_scope_uses_broader_role_terms() -> None:
    terms = build_arbeitsagentur_search_terms(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        options=DiscoveryAdapterOptions(search_scope="broad"),
    )

    assert terms == ["Frontend", "Developer"]


def test_arbeitsagentur_adapter_builds_bounded_query_candidates() -> None:
    queries = build_arbeitsagentur_query_candidates(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        options=DiscoveryAdapterOptions(search_scope="broad"),
    )

    assert [query["was"] for query in queries] == [
        "Frontend Developer",
        "Senior Frontend Developer",
        "Frontend Developer",
    ]
    assert "wo" in queries[0]
    assert "wo" in queries[1]
    assert "wo" not in queries[2]
    assert len(queries) <= 3


def test_arbeitsagentur_adapter_maps_api_response_item() -> None:
    item = map_arbeitsagentur_job(
        {
            "refnr": "10000-123456789-S",
            "titel": "Software Engineer",
            "arbeitgeber": "Example GmbH",
            "arbeitsort": {"ort": "Berlin"},
            "kurzbeschreibung": "Python backend role.",
            "aktuelleVeroeffentlichungsdatum": "2026-05-01",
        }
    )

    assert item is not None
    assert item.external_id == "10000-123456789-S"
    assert item.source_url.endswith("/10000-123456789-S")
    assert item.title == "Software Engineer"
    assert item.company == "Example GmbH"
    assert item.location == "Berlin"
    assert item.snippet == "Python backend role."
    assert item.raw_metadata == {"refnr": "10000-123456789-S"}


def test_arbeitsagentur_adapter_rejects_non_http_result_url() -> None:
    item = map_arbeitsagentur_job(
        {
            "refnr": "10000-123456789-S",
            "externeUrl": "javascript:alert(1)",
            "titel": "Software Engineer",
        }
    )

    assert item is not None
    assert item.source_url == (
        "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-123456789-S"
    )


@pytest.mark.asyncio
async def test_arbeitsagentur_adapter_uses_public_header_and_maps_results() -> None:
    seen_queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.headers["X-API-Key"] == ARBEITSAGENTUR_PUBLIC_CLIENT_ID
        seen_queries.append(request.url.params["was"])
        assert request.url.params["wo"] == "Berlin"
        assert request.url.params["size"] == "5"
        if len(seen_queries) > 1:
            return httpx.Response(200, json={"stellenangebote": []})
        return httpx.Response(
            200,
            json={
                "stellenangebote": [
                    {
                        "refnr": "10000-123456789-S",
                        "titel": "Software Engineer",
                        "arbeitgeber": "Example GmbH",
                        "arbeitsort": {"ort": "Berlin"},
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("arbeitsagentur")
        assert source is not None
        result = await ArbeitsagenturAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].title == "Software Engineer"
    assert result.warnings == ["arbeitsagentur_dry_run_preview_only"]
    assert seen_queries == [
        "Backend Engineer Python FastAPI",
        "Backend Engineer",
    ]


@pytest.mark.asyncio
async def test_arbeitsagentur_adapter_merges_sparse_broader_results() -> None:
    seen_queries: list[tuple[str, bool]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_queries.append((request.url.params["was"], "wo" in request.url.params))
        if len(seen_queries) == 1:
            return httpx.Response(
                200,
                json={
                    "stellenangebote": [
                        {
                            "refnr": "10000-frontend-1-S",
                            "titel": "Frontend Developer",
                        }
                    ]
                },
            )
        if len(seen_queries) == 3:
            return httpx.Response(
                200,
                json={
                    "stellenangebote": [
                        {
                            "refnr": "10000-frontend-3-S",
                            "titel": "Remote Frontend Developer",
                        }
                    ]
                },
            )
        return httpx.Response(
            200,
            json={
                "stellenangebote": [
                    {
                        "refnr": "10000-frontend-2-S",
                        "titel": "React Developer",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("arbeitsagentur")
        assert source is not None
        result = await ArbeitsagenturAdapter(client=client).discover(
            loop=make_loop(target_role="Senior Frontend Developer", keywords=["React"]),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5, search_scope="broad"),
        )

    assert seen_queries == [
        ("Frontend Developer", True),
        ("Senior Frontend Developer", True),
        ("Frontend Developer", False),
    ]
    assert result.status == "completed"
    assert result.items_previewed == 3
    assert [item.external_id for item in result.items] == [
        "10000-frontend-1-S",
        "10000-frontend-2-S",
        "10000-frontend-3-S",
    ]


@pytest.mark.asyncio
async def test_arbeitsagentur_adapter_handles_api_error_safely() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("arbeitsagentur")
        assert source is not None
        result = await ArbeitsagenturAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["arbeitsagentur_api_unavailable"]


@pytest.mark.asyncio
async def test_arbeitsagentur_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("arbeitsagentur")
        assert source is not None
        result = await ArbeitsagenturAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["arbeitsagentur_timeout"]


@pytest.mark.asyncio
async def test_arbeitsagentur_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("arbeitsagentur")
        assert source is not None
        result = await ArbeitsagenturAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[], location=None),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["arbeitsagentur_requires_search_terms"]
