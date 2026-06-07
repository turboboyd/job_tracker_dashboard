from __future__ import annotations

from types import SimpleNamespace

import httpx
import pytest

from app.modules.discovery_adapters.adapters.ats import (
    GreenhouseAdapter,
    LeverAdapter,
    map_greenhouse_job,
    map_lever_job,
)
from app.modules.discovery_adapters.schemas import DiscoveryAdapterOptions
from app.modules.discovery_sources.registry import get_discovery_source


def make_loop(**overrides):
    data = {"target_role": "Frontend", "keywords": ["React"]}
    data.update(overrides)
    return SimpleNamespace(**data)


def test_greenhouse_adapter_maps_job_board_item() -> None:
    item = map_greenhouse_job(
        {
            "id": 100,
            "company_name": "Example GmbH",
            "absolute_url": "https://boards.greenhouse.io/example/jobs/100",
            "title": "Frontend Engineer",
            "content": "React role.",
            "offices": [{"name": "Berlin"}],
            "departments": [{"name": "Engineering"}],
        },
        search_text="Frontend React",
    )

    assert item is not None
    assert item.external_id == "100"
    assert item.title == "Frontend Engineer"
    assert item.company == "Example GmbH"
    assert item.location == "Berlin"
    assert item.raw_metadata == {"department": "Engineering"}


def test_lever_adapter_maps_posting_item() -> None:
    item = map_lever_job(
        {
            "id": "lever-1",
            "hostedUrl": "https://jobs.lever.co/example/lever-1",
            "text": "Frontend Engineer",
            "descriptionPlain": "React role.",
            "categories": {"location": "Berlin", "team": "Engineering"},
        },
        search_text="Frontend React",
        company_name="example",
    )

    assert item is not None
    assert item.external_id == "lever-1"
    assert item.title == "Frontend Engineer"
    assert item.company == "example"
    assert item.location == "Berlin"
    assert item.raw_metadata == {"team": "Engineering", "site_name": "example"}


def test_lever_adapter_maps_workplace_employment_and_salary() -> None:
    item = map_lever_job(
        {
            "id": "lever-9",
            "hostedUrl": "https://jobs.lever.co/example/lever-9",
            "text": "Frontend Engineer",
            "descriptionPlain": "React role.",
            "categories": {
                "location": "Berlin",
                "team": "Engineering",
                "commitment": "Full-time",
            },
            "workplaceType": "remote",
            "salaryRange": {
                "min": 70000,
                "max": 90000.0,
                "currency": "EUR",
                "interval": "per-year-salary",
            },
        },
        search_text="Frontend React",
        company_name="example",
    )

    assert item is not None
    assert item.raw_metadata == {
        "team": "Engineering",
        "site_name": "example",
        "employment_type": "Full-time",
        "workplace_type": "remote",
        "salary_min": 70000,
        "salary_max": 90000,
        "salary_currency": "EUR",
    }


def test_lever_adapter_drops_unspecified_workplace_and_empty_salary() -> None:
    item = map_lever_job(
        {
            "id": "lever-10",
            "hostedUrl": "https://jobs.lever.co/example/lever-10",
            "text": "Frontend Engineer",
            "descriptionPlain": "React role.",
            "categories": {"team": "Engineering"},
            "workplaceType": "unspecified",
            "salaryRange": {"min": 0, "max": None, "currency": "EUR"},
        },
        search_text="Frontend React",
        company_name="example",
    )

    assert item is not None
    assert item.raw_metadata == {"team": "Engineering", "site_name": "example"}


@pytest.mark.asyncio
async def test_greenhouse_adapter_skips_when_not_configured() -> None:
    source = get_discovery_source("greenhouse")
    assert source is not None

    result = await GreenhouseAdapter(board_tokens=[]).discover(
        loop=make_loop(),
        source=source,
        options=DiscoveryAdapterOptions(),
    )

    assert result.status == "skipped"
    assert result.warnings == ["greenhouse_not_configured"]


@pytest.mark.asyncio
async def test_lever_adapter_skips_when_not_configured() -> None:
    source = get_discovery_source("lever")
    assert source is not None

    result = await LeverAdapter(site_names=[]).discover(
        loop=make_loop(),
        source=source,
        options=DiscoveryAdapterOptions(),
    )

    assert result.status == "skipped"
    assert result.warnings == ["lever_not_configured"]


@pytest.mark.asyncio
async def test_greenhouse_adapter_fetches_configured_boards_and_limits_results() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "example" in str(request.url)
        assert request.url.params["content"] == "true"
        return httpx.Response(
            200,
            json={
                "jobs": [
                    {
                        "id": 100,
                        "absolute_url": "https://boards.greenhouse.io/example/jobs/100",
                        "title": "Frontend Engineer",
                        "content": "React role.",
                    },
                    {
                        "id": 101,
                        "absolute_url": "https://boards.greenhouse.io/example/jobs/101",
                        "title": "Sales",
                        "content": "Sales role.",
                    },
                ]
            },
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("greenhouse")
        assert source is not None
        result = await GreenhouseAdapter(
            client=client,
            board_tokens=["example"],
        ).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=1),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].title == "Frontend Engineer"
    assert result.items[0].company == "example"
    assert result.items[0].raw_metadata["board_token"] == "example"
    assert result.warnings == ["greenhouse_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_lever_adapter_fetches_configured_sites_and_limits_results() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert "example" in str(request.url)
        assert request.url.params["mode"] == "json"
        return httpx.Response(
            200,
            json=[
                {
                    "id": "lever-1",
                    "hostedUrl": "https://jobs.lever.co/example/lever-1",
                    "text": "Frontend Engineer",
                    "descriptionPlain": "React role.",
                },
                {
                    "id": "lever-2",
                    "hostedUrl": "https://jobs.lever.co/example/lever-2",
                    "text": "Sales",
                    "descriptionPlain": "Sales role.",
                },
            ],
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("lever")
        assert source is not None
        result = await LeverAdapter(
            client=client,
            site_names=["example"],
        ).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=1),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].title == "Frontend Engineer"
    assert result.items[0].company == "example"
    assert result.items[0].raw_metadata["site_name"] == "example"
    assert result.warnings == ["lever_dry_run_preview_only"]


@pytest.mark.asyncio
async def test_ats_adapters_dedupe_items_before_paging() -> None:
    def handler(_request: httpx.Request) -> httpx.Response:
        return httpx.Response(
            200,
            json=[
                {
                    "id": "lever-1",
                    "hostedUrl": "https://jobs.lever.co/example/lever-1",
                    "text": "Frontend Engineer",
                    "descriptionPlain": "React role.",
                }
            ],
        )

    async with httpx.AsyncClient(transport=httpx.MockTransport(handler)) as client:
        source = get_discovery_source("lever")
        assert source is not None
        result = await LeverAdapter(
            client=client,
            site_names=["example", "example-copy"],
        ).discover(
            loop=make_loop(),
            source=source,
            options=DiscoveryAdapterOptions(max_results=5),
        )

    assert result.status == "completed"
    assert result.items_previewed == 1
    assert result.items[0].external_id == "lever-1"
