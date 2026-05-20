from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.arbeitnow import (
    ArbeitnowAdapter,
    map_arbeitnow_job,
    _source_pages_for_preview_page,
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


def arbeitnow_payload():
    return {
        "data": [
            {
                "slug": "frontend-react-berlin",
                "url": "https://www.arbeitnow.com/jobs/companies/example/frontend-react-berlin",
                "title": "Frontend React Developer",
                "company_name": "Example GmbH",
                "location": "Berlin",
                "description": "Build React interfaces.",
                "remote": False,
                "tags": ["React", "TypeScript"],
                "job_types": ["full-time"],
                "created_at": "2026-05-01T00:00:00+00:00",
            },
            {
                "slug": "backend-munich",
                "url": "https://www.arbeitnow.com/jobs/companies/example/backend-munich",
                "title": "Backend Developer",
                "company_name": "Example GmbH",
                "location": "Munich",
                "description": "Python APIs.",
                "remote": False,
                "tags": ["Python"],
            },
        ]
    }


def test_arbeitnow_adapter_maps_api_response_item() -> None:
    item = map_arbeitnow_job(arbeitnow_payload()["data"][0])

    assert item is not None
    assert item.external_id == "frontend-react-berlin"
    assert item.title == "Frontend React Developer"
    assert item.company == "Example GmbH"
    assert item.location == "Berlin"
    assert item.raw_metadata == {
        "remote": False,
        "tags": ["React", "TypeScript"],
        "job_types": ["full-time"],
        "source_attribution": "Arbeitnow",
    }


def test_arbeitnow_adapter_rejects_non_http_result_url() -> None:
    item = map_arbeitnow_job(
        {
            "slug": "bad",
            "url": "javascript:alert(1)",
            "title": "Frontend Developer",
        }
    )

    assert item is None


@pytest.mark.asyncio
async def test_arbeitnow_adapter_fetches_filters_and_maps_results() -> None:
    seen_pages: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_pages.append(request.url.params["page"])
        return httpx.Response(200, json=arbeitnow_payload())

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("arbeitnow")
        assert source is not None
        result = await ArbeitnowAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(page=1, page_size=5),
        )

    assert seen_pages == ["1", "2", "3"]
    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url.endswith("frontend-react-berlin")
    assert result.warnings == ["arbeitnow_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_arbeitnow_adapter_keeps_remote_jobs_when_location_differs() -> None:
    payload = {
        "data": [
            {
                "slug": "remote-frontend",
                "url": "https://www.arbeitnow.com/jobs/companies/example/remote-frontend",
                "title": "Frontend Developer",
                "company_name": "Example GmbH",
                "location": "Europe",
                "description": "React role.",
                "remote": True,
                "tags": ["React"],
            }
        ]
    }

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(200, json=payload))
    ) as client:
        source = get_discovery_source("arbeitnow")
        assert source is not None
        result = await ArbeitnowAdapter(client=client).discover(
            loop=make_loop(location="Berlin"),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.items_previewed == 1
    assert result.items[0].external_id == "remote-frontend"


def test_arbeitnow_adapter_maps_preview_page_to_small_source_page_window() -> None:
    assert list(_source_pages_for_preview_page(1)) == [1, 2, 3]
    assert list(_source_pages_for_preview_page(2)) == [4, 5, 6]


@pytest.mark.asyncio
async def test_arbeitnow_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("arbeitnow")
        assert source is not None
        result = await ArbeitnowAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[]),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["arbeitnow_requires_search_terms"]


@pytest.mark.asyncio
async def test_arbeitnow_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("arbeitnow")
        assert source is not None
        result = await ArbeitnowAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["arbeitnow_timeout"]
