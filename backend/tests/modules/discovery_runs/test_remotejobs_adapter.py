from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.remotejobs import (
    RemoteJobsAdapter,
    build_remotejobs_search_queries,
    map_remotejobs_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {"target_role": "Frontend Developer", "keywords": ["React"]}
    data.update(overrides)
    return SimpleNamespace(**data)


def remotejobs_payload():
    return {
        "data": [
            {
                "id": "job-1",
                "title": "Senior Frontend Engineer",
                "url": "https://remotejobs.org/remote-jobs/senior-frontend-engineer",
                "apply_url": "https://remotejobs.org/remote-jobs/senior-frontend-engineer",
                "company": {"name": "Remote Example"},
                "category": {"name": "Programming", "slug": "programming"},
                "location": "Remote (Europe)",
                "type": "Full-time",
                "description": "React and TypeScript role.",
                "salary_text": "EUR",
                "posted_at": "2026-05-01T00:00:00Z",
                "is_translated": False,
            }
        ],
        "pagination": {"has_more": True},
        "meta": {"powered_by": "RemoteJobs.org"},
    }


def test_remotejobs_adapter_maps_api_response_item() -> None:
    item = map_remotejobs_job(remotejobs_payload()["data"][0])

    assert item is not None
    assert item.external_id == "job-1"
    assert item.title == "Senior Frontend Engineer"
    assert item.company == "Remote Example"
    assert item.location == "Remote (Europe)"
    assert item.raw_metadata == {
        "apply_url": "https://remotejobs.org/remote-jobs/senior-frontend-engineer",
        "category": "Programming",
        "category_slug": "programming",
        "job_type": "Full-time",
        "salary_text": "EUR",
        "is_translated": False,
        "source_attribution": "RemoteJobs.org",
    }


def test_remotejobs_adapter_rejects_non_http_result_url() -> None:
    item = map_remotejobs_job({"id": "bad", "url": "javascript:alert(1)"})

    assert item is None


def test_remotejobs_adapter_builds_broader_fallback_queries() -> None:
    assert build_remotejobs_search_queries(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        search_scope="broad",
    ) == [
        "Senior Frontend Developer React TypeScript",
        "Frontend Developer",
        "React TypeScript",
    ]


@pytest.mark.asyncio
async def test_remotejobs_adapter_fetches_with_limit_offset_and_query() -> None:
    seen_params: list[dict[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_params.append(dict(request.url.params.multi_items()))
        return httpx.Response(200, json=remotejobs_payload())

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotejobs")
        assert source is not None
        result = await RemoteJobsAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(page=2, page_size=5),
        )

    assert seen_params == [
        {"q": "Frontend Developer React", "limit": "5", "offset": "5"}
    ]
    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url.endswith("senior-frontend-engineer")
    assert result.warnings == ["remotejobs_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_remotejobs_adapter_uses_broader_query_when_primary_is_empty() -> None:
    seen_queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        query = request.url.params["q"]
        seen_queries.append(query)
        if query == "Frontend Developer":
            return httpx.Response(200, json=remotejobs_payload())
        return httpx.Response(200, json={"data": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotejobs")
        assert source is not None
        result = await RemoteJobsAdapter(client=client).discover(
            loop=make_loop(target_role="Senior Frontend Developer", keywords=["React"]),
            source=source,
            options=DiscoveryAdapterOptions(search_scope="broad", page=1, page_size=5),
        )

    assert seen_queries == [
        "Senior Frontend Developer React",
        "Frontend Developer",
    ]
    assert result.status == "completed"
    assert result.items_previewed == 1


@pytest.mark.asyncio
async def test_remotejobs_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("remotejobs")
        assert source is not None
        result = await RemoteJobsAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[]),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["remotejobs_requires_search_terms"]


@pytest.mark.asyncio
async def test_remotejobs_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remotejobs")
        assert source is not None
        result = await RemoteJobsAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["remotejobs_timeout"]
