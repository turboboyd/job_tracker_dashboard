from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.remoteok import (
    RemoteOkAdapter,
    map_remoteok_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {"target_role": "Frontend Developer", "keywords": ["React"]}
    data.update(overrides)
    return SimpleNamespace(**data)


def remoteok_payload():
    return [
        {
            "last_updated": 1_779_206_405,
            "legal": "Mention Remote OK as a source.",
        },
        {
            "slug": "remote-frontend-engineer-example-1131",
            "id": "1131",
            "date": "2026-05-16T16:00:03+00:00",
            "company": "Remote OK Example",
            "position": "Senior Frontend Engineer",
            "tags": ["react", "typescript", "frontend"],
            "description": "<p>Build React interfaces.</p>",
            "location": "Europe",
            "salary_min": 80_000,
            "salary_max": 120_000,
            "url": "https://remoteok.com/remote-jobs/remote-frontend-engineer-example-1131",
        },
        {
            "slug": "remote-db-engineer-example-1132",
            "id": "1132",
            "company": "Remote OK Example",
            "position": "Database Reliability Engineer",
            "tags": ["postgres"],
            "description": "Postgres role.",
            "url": "https://remoteok.com/remote-jobs/remote-db-engineer-example-1132",
        },
    ]


def test_remoteok_adapter_maps_api_response_item() -> None:
    item = map_remoteok_job(remoteok_payload()[1])

    assert item is not None
    assert item.external_id == "1131"
    assert item.title == "Senior Frontend Engineer"
    assert item.company == "Remote OK Example"
    assert item.location == "Europe"
    assert item.raw_metadata == {
        "slug": "remote-frontend-engineer-example-1131",
        "tags": ["react", "typescript", "frontend"],
        "salary_text": "80000-120000",
        "source_attribution": "Remote OK",
    }


def test_remoteok_adapter_rejects_non_http_result_url() -> None:
    item = map_remoteok_job({"id": "bad", "url": "javascript:alert(1)"})

    assert item is None


@pytest.mark.asyncio
async def test_remoteok_adapter_fetches_filters_and_maps_results() -> None:
    seen_headers: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_headers.append(request.headers["User-Agent"])
        return httpx.Response(200, json=remoteok_payload())

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remoteok")
        assert source is not None
        result = await RemoteOkAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(page=1, page_size=5),
        )

    assert seen_headers == ["job-tracker-dashboard/preview"]
    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].source_url.endswith("remote-frontend-engineer-example-1131")
    assert result.warnings == ["remoteok_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_remoteok_adapter_uses_preview_page_slice() -> None:
    payload = [
        {
            "id": str(index),
            "company": "Example",
            "position": f"Frontend Developer {index}",
            "tags": ["react"],
            "url": f"https://remoteok.com/remote-jobs/frontend-{index}",
        }
        for index in range(1, 8)
    ]

    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(200, json=payload))
    ) as client:
        source = get_discovery_source("remoteok")
        assert source is not None
        result = await RemoteOkAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(page=2, page_size=5),
        )

    assert [item.external_id for item in result.items] == ["6", "7"]


@pytest.mark.asyncio
async def test_remoteok_adapter_skips_empty_query() -> None:
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda _request: httpx.Response(500))
    ) as client:
        source = get_discovery_source("remoteok")
        assert source is not None
        result = await RemoteOkAdapter(client=client).discover(
            loop=make_loop(target_role=None, keywords=[]),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "skipped"
    assert result.warnings == ["remoteok_requires_search_terms"]


@pytest.mark.asyncio
async def test_remoteok_adapter_handles_timeout_safely() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout")

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("remoteok")
        assert source is not None
        result = await RemoteOkAdapter(client=client).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(),
        )

    assert result.status == "failed"
    assert result.errors == ["remoteok_timeout"]
