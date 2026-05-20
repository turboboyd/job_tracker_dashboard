from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.himalayas import (
    HimalayasAdapter,
    build_himalayas_search_queries,
    map_himalayas_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {"target_role": "Frontend Developer", "keywords": ["React"]}
    data.update(overrides)
    return SimpleNamespace(**data)


def himalayas_payload():
    return {
        "updatedAt": 1_778_000_000_000,
        "page": 1,
        "totalCount": 1,
        "jobs": [
            {
                "guid": "job-1",
                "title": "Senior Frontend Engineer",
                "excerpt": "React and TypeScript role.",
                "companyName": "Himalayas Example",
                "companySlug": "himalayas-example",
                "employmentType": "Full Time",
                "minSalary": 80_000,
                "maxSalary": 120_000,
                "currency": "EUR",
                "seniority": ["Senior"],
                "locationRestrictions": [{"name": "Germany", "alpha2": "DE"}],
                "timezoneRestrictions": ["UTC+01:00"],
                "categories": ["Engineering"],
                "parentCategories": ["Software Development"],
                "description": "<p>Build remote UI.</p>",
                "pubDate": "2026-05-01T00:00:00Z",
                "applicationLink": "https://himalayas.app/companies/example/jobs/frontend",
            }
        ],
    }


def test_himalayas_adapter_maps_api_response_item() -> None:
    item = map_himalayas_job(himalayas_payload()["jobs"][0])

    assert item is not None
    assert item.external_id == "job-1"
    assert item.title == "Senior Frontend Engineer"
    assert item.company == "Himalayas Example"
    assert item.location == "Germany"
    assert item.raw_metadata == {
        "company_slug": "himalayas-example",
        "employment_type": "Full Time",
        "seniority": ["Senior"],
        "categories": ["Engineering"],
        "parent_categories": ["Software Development"],
        "timezone_restrictions": ["UTC+01:00"],
        "salary_text": "EUR 80000-120000",
        "source_attribution": "Himalayas",
    }


def test_himalayas_adapter_rejects_non_http_result_url() -> None:
    item = map_himalayas_job({"guid": "bad", "applicationLink": "javascript:alert(1)"})

    assert item is None


def test_himalayas_adapter_builds_broader_fallback_queries() -> None:
    assert build_himalayas_search_queries(
        make_loop(target_role="Senior Frontend Developer", keywords=["React", "TypeScript"]),
        search_scope="broad",
    ) == [
        "Senior Frontend Developer React TypeScript",
        "Frontend Developer",
        "React TypeScript",
    ]


@pytest.mark.asyncio
async def test_himalayas_adapter_fetches_with_page_and_query() -> None:
    seen_params: list[dict[str, str]] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_params.append(dict(request.url.params.multi_items()))
        return httpx.Response(200, json=himalayas_payload())

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("himalayas")
        assert source is not None
        result = await HimalayasAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(page=2, page_size=5),
        )

    assert seen_params == [{"q": "Frontend Developer React", "page": "2"}]
    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url.endswith("/frontend")
    assert result.warnings == ["himalayas_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_himalayas_adapter_uses_broader_query_when_primary_is_empty() -> None:
    seen_queries: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        query = request.url.params["q"]
        seen_queries.append(query)
        if query == "Frontend Developer":
            return httpx.Response(200, json=himalayas_payload())
        return httpx.Response(200, json={"jobs": []})

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("himalayas")
        assert source is not None
        result = await HimalayasAdapter(client=client).discover(
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
async def test_himalayas_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("himalayas")
        assert source is not None
        result = await HimalayasAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[]),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["himalayas_requires_search_terms"]


@pytest.mark.asyncio
async def test_himalayas_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("himalayas")
        assert source is not None
        result = await HimalayasAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["himalayas_timeout"]
