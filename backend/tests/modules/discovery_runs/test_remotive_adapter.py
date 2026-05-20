from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.remotive import (
    RemotiveAdapter,
    build_remotive_search_queries,
    map_remotive_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {"target_role": "Backend Developer", "keywords": ["Python"]}
    data.update(overrides)
    return SimpleNamespace(**data)


def test_remotive_adapter_builds_broad_fallback_query() -> None:
    queries = build_remotive_search_queries(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"])
    )

    assert queries == [
        "Senior Frontend Developer React TypeScript",
        "React TypeScript",
        "Frontend Developer",
    ]


def test_remotive_adapter_broad_scope_uses_broader_role_fallback() -> None:
    queries = build_remotive_search_queries(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        search_scope="broad",
    )

    assert queries == [
        "Senior Frontend Developer React TypeScript",
        "Frontend Developer",
        "Frontend",
    ]


def test_remotive_adapter_maps_api_response_item() -> None:
    item = map_remotive_job(
        {
            "id": 123,
            "url": "https://remotive.com/remote-jobs/software-dev/backend-123",
            "title": "Backend Developer",
            "company_name": "Remote GmbH",
            "candidate_required_location": "Germany",
            "description": "Python role.",
            "publication_date": "2026-05-01",
            "category": "Software Development",
            "salary": "EUR",
        }
    )

    assert item is not None
    assert item.external_id == "123"
    assert item.title == "Backend Developer"
    assert item.company == "Remote GmbH"
    assert item.location == "Germany"
    assert item.raw_metadata == {
        "category": "Software Development",
        "salary": "EUR",
        "source_attribution": "Remotive",
    }


@pytest.mark.asyncio
async def test_remotive_adapter_builds_safe_query_and_maps_results() -> None:
    seen_queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_queries.append(request.url.params["search"])
        assert request.url.params["limit"] == "5"
        if len(seen_queries) > 1:
            return httpx.Response(200, json={"jobs": []})
        return httpx.Response(
            200,
            json={
                "jobs": [
                    {
                        "id": 123,
                        "url": "https://remotive.com/remote-jobs/software-dev/backend-123",
                        "title": "Backend Developer",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotive")
        assert source is not None
        result = await RemotiveAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url.endswith("backend-123")
    assert result.warnings == ["remotive_dry_run_preview_only"]
    assert seen_queries == [
        "Backend Developer Python",
        "Python Backend Developer",
        "Backend Developer",
    ]


@pytest.mark.asyncio
async def test_remotive_adapter_uses_bounded_broader_queries_when_sparse() -> None:
    seen_queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_queries.append(request.url.params["search"])
        if len(seen_queries) == 1:
            return httpx.Response(200, json={"jobs": []})
        if len(seen_queries) == 2:
            return httpx.Response(
                200,
                json={
                    "jobs": [
                        {
                            "id": 456,
                            "url": "https://remotive.com/remote-jobs/software-dev/frontend-456",
                            "title": "Frontend Developer",
                        }
                    ]
                },
            )
        return httpx.Response(
            200,
            json={
                "jobs": [
                    {
                        "id": 789,
                        "url": "https://remotive.com/remote-jobs/software-dev/react-789",
                        "title": "React Developer",
                    }
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotive")
        assert source is not None
        result = await RemotiveAdapter(client=client).discover(
            loop=make_loop(target_role="Senior Frontend Developer", keywords=["React"]),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5, search_scope="broad"),
        )

    assert seen_queries == [
        "Senior Frontend Developer React",
        "Frontend Developer",
        "Frontend",
    ]
    assert result.status == "completed"
    assert result.items_previewed == 2
    assert result.items[0].external_id == "456"
    assert result.items[1].external_id == "789"


@pytest.mark.asyncio
async def test_remotive_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("remotive")
        assert source is not None
        result = await RemotiveAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[]),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["remotive_requires_search_terms"]


@pytest.mark.asyncio
async def test_remotive_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotive")
        assert source is not None
        result = await RemotiveAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["remotive_timeout"]
