from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.adzuna import (
    AdzunaAdapter,
    build_adzuna_query_candidates,
    map_adzuna_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {
        "target_role": "Frontend Developer",
        "keywords": ["React"],
        "location": "Berlin",
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def test_adzuna_adapter_maps_api_response_item() -> None:
    item = map_adzuna_job(
        {
            "id": "adzuna-1",
            "redirect_url": "https://www.adzuna.de/details/1",
            "title": "Frontend Developer",
            "company": {"display_name": "Example GmbH"},
            "location": {"display_name": "Berlin"},
            "description": "React and TypeScript role.",
            "created": "2026-05-01T00:00:00Z",
            "category": {"label": "IT Jobs"},
            "contract_type": "permanent",
        }
    )

    assert item is not None
    assert item.external_id == "adzuna-1"
    assert item.source_url == "https://www.adzuna.de/details/1"
    assert item.title == "Frontend Developer"
    assert item.company == "Example GmbH"
    assert item.location == "Berlin"
    assert item.raw_metadata == {
        "category": "IT Jobs",
        "contract_type": "permanent",
    }


def test_adzuna_adapter_builds_bounded_query_candidates() -> None:
    queries = build_adzuna_query_candidates(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        options=DiscoveryAdapterOptions(search_scope="broad", max_results=5),
        app_id="app-id",
        app_key="app-key",
    )

    assert [query.get("what") for query in queries] == [
        "Senior Frontend Developer React TypeScript",
        "React TypeScript",
        "Frontend Developer",
    ]
    assert all(query["where"] == "Berlin" for query in queries)
    assert len(queries) == 3


@pytest.mark.asyncio
async def test_adzuna_adapter_skips_when_not_configured() -> None:
    source = get_discovery_source("adzuna")
    assert source is not None

    result = await AdzunaAdapter(app_id="", app_key="").discover(
        loop=make_loop(),
        source=source,
        options=DiscoveryAdapterOptions(),
    )

    assert result.status == "skipped"
    assert result.warnings == ["adzuna_not_configured"]


@pytest.mark.asyncio
async def test_adzuna_adapter_builds_safe_query_and_maps_results() -> None:
    seen_queries: list[str | None] = []

    def handler(request: httpx.Request) -> httpx.Response:
        assert request.url.params["app_id"] == "app-id"
        assert request.url.params["app_key"] == "app-key"
        seen_queries.append(request.url.params.get("what"))
        assert request.url.params["where"] == "Berlin"
        assert request.url.params["results_per_page"] == "5"
        if len(seen_queries) > 1:
            return httpx.Response(200, json={"results": []})
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "id": "adzuna-1",
                        "redirect_url": "https://www.adzuna.de/details/1",
                        "title": "Frontend Developer",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("adzuna")
        assert source is not None
        result = await AdzunaAdapter(
            client=client,
            app_id="app-id",
            app_key="app-key",
        ).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url == "https://www.adzuna.de/details/1"
    assert result.warnings == ["adzuna_dry_run_preview_only"]
    assert seen_queries == [
        "Frontend Developer React",
        "React Frontend Developer",
        "Frontend Developer",
    ]


@pytest.mark.asyncio
async def test_adzuna_adapter_merges_sparse_broader_results() -> None:
    seen_queries: list[str | None] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_queries.append(request.url.params.get("what"))
        if len(seen_queries) == 1:
            return httpx.Response(
                200,
                json={
                    "results": [
                        {
                            "id": "adzuna-1",
                            "redirect_url": "https://www.adzuna.de/details/1",
                            "title": "Frontend Developer",
                        }
                    ]
                },
            )
        return httpx.Response(
            200,
            json={
                "results": [
                    {
                        "id": "adzuna-2",
                        "redirect_url": "https://www.adzuna.de/details/2",
                        "title": "React Developer",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("adzuna")
        assert source is not None
        result = await AdzunaAdapter(
            client=client,
            app_id="app-id",
            app_key="app-key",
        ).discover(
            loop=make_loop(target_role="Senior Frontend Developer", keywords=["React"]),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5, search_scope="broad"),
        )

    assert seen_queries == [
        "Senior Frontend Developer React",
        "React Senior Frontend Developer",
        "Frontend Developer",
    ]
    assert result.status == "completed"
    assert result.items_previewed == 2
    assert [item.external_id for item in result.items] == [
        "adzuna-1",
        "adzuna-2",
    ]


@pytest.mark.asyncio
async def test_adzuna_adapter_handles_api_error_safely() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("adzuna")
        assert source is not None
        result = await AdzunaAdapter(
            client=client,
            app_id="app-id",
            app_key="app-key",
        ).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["adzuna_api_unavailable"]
