from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.db.models.loop import Loop
from app.modules.discovery_adapters.adapters.utils import (
    clean_string,
    csv_values,
    is_allowed_url,
    search_text_from_loop,
)
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource

GREENHOUSE_BOARD_URL = "https://boards-api.greenhouse.io/v1/boards/{token}/jobs"
LEVER_POSTINGS_URL = "https://api.lever.co/v0/postings/{site}"


class GreenhouseAdapter:
    source_id = "greenhouse"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        board_tokens: list[str] | None = None,
    ) -> None:
        settings = None if board_tokens is not None else get_settings()
        self._client = client
        self._board_tokens = board_tokens if board_tokens is not None else csv_values(
            getattr(settings, "GREENHOUSE_BOARD_TOKENS", "")
        )

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        if not self._board_tokens:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["greenhouse_not_configured"],
            )

        search_text = search_text_from_loop(loop)
        try:
            payloads = await _fetch_many(
                client=self._client,
                urls=[
                    GREENHOUSE_BOARD_URL.format(token=token)
                    for token in self._board_tokens[: options.max_results]
                ],
                params={"content": "true"},
                options=options,
            )
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["greenhouse_timeout"])
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["greenhouse_api_unavailable"])
        except ValueError:
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["greenhouse_invalid_response"])

        jobs = [
            (token, job)
            for token, payload in zip(self._board_tokens, payloads, strict=False)
            for job in _extract_greenhouse_jobs(payload)
        ]
        mapped_items = [
            item
            for item in (
                map_greenhouse_job(job, search_text=search_text, company_name=token)
                for token, job in jobs
            )
            if item is not None
        ]
        mapped_items = _dedupe_items(mapped_items)
        start = (options.page - 1) * options.page_size
        items = mapped_items[start : start + options.page_size]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["greenhouse_dry_run_preview_only"],
        )


class LeverAdapter:
    source_id = "lever"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        site_names: list[str] | None = None,
    ) -> None:
        settings = None if site_names is not None else get_settings()
        self._client = client
        self._site_names = site_names if site_names is not None else csv_values(
            getattr(settings, "LEVER_SITE_NAMES", "")
        )

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        if not self._site_names:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["lever_not_configured"],
            )

        search_text = search_text_from_loop(loop)
        try:
            payloads = await _fetch_many(
                client=self._client,
                urls=[
                    LEVER_POSTINGS_URL.format(site=site)
                    for site in self._site_names[: options.max_results]
                ],
                params={"mode": "json"},
                options=options,
            )
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["lever_timeout"])
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["lever_api_unavailable"])
        except ValueError:
            return DiscoveryAdapterResult(source_id=source.id, status="failed", errors=["lever_invalid_response"])

        jobs = [
            (site, job)
            for site, payload in zip(self._site_names, payloads, strict=False)
            for job in _extract_lever_jobs(payload)
        ]
        mapped_items = [
            item
            for item in (
                map_lever_job(job, search_text=search_text, company_name=site)
                for site, job in jobs
            )
            if item is not None
        ]
        mapped_items = _dedupe_items(mapped_items)
        start = (options.page - 1) * options.page_size
        items = mapped_items[start : start + options.page_size]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["lever_dry_run_preview_only"],
        )


async def _fetch_many(
    *,
    client: httpx.AsyncClient | None,
    urls: list[str],
    params: dict[str, str],
    options: DiscoveryAdapterOptions,
) -> list[Any]:
    if client is not None:
        responses = [await client.get(url, params=params) for url in urls]
        for response in responses:
            response.raise_for_status()
        return [response.json() for response in responses]

    timeout = httpx.Timeout(options.timeout_seconds)
    async with httpx.AsyncClient(timeout=timeout) as owned_client:
        responses = [await owned_client.get(url, params=params) for url in urls]
        for response in responses:
            response.raise_for_status()
        return [response.json() for response in responses]


def map_greenhouse_job(
    job: dict[str, Any],
    *,
    search_text: str | None,
    company_name: str | None = None,
) -> DiscoveryAdapterItem | None:
    title = clean_string(job.get("title"))
    content = clean_string(job.get("content"), max_length=800)
    if search_text and not _matches_search(search_text, title, content):
        return None

    source_url = clean_string(job.get("absolute_url"))
    if not is_allowed_url(source_url):
        return None

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id")),
        source_url=source_url or "",
        title=title,
        company=clean_string(job.get("company_name") or company_name),
        location=_greenhouse_location(job),
        snippet=content,
        raw_metadata={
            key: value
            for key, value in {
                "department": _greenhouse_department(job),
                "board_token": clean_string(company_name),
            }.items()
            if value
        },
        confidence={"source_quality": 0.66},
    )


def map_lever_job(
    job: dict[str, Any],
    *,
    search_text: str | None,
    company_name: str | None = None,
) -> DiscoveryAdapterItem | None:
    title = clean_string(job.get("text"))
    description = clean_string(job.get("descriptionPlain"), max_length=800)
    if search_text and not _matches_search(search_text, title, description):
        return None

    source_url = clean_string(job.get("hostedUrl") or job.get("applyUrl"))
    if not is_allowed_url(source_url):
        return None

    categories = job.get("categories")
    location = None
    team = None
    if isinstance(categories, dict):
        location = clean_string(categories.get("location"))
        team = clean_string(categories.get("team"))

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id")),
        source_url=source_url or "",
        title=title,
        company=clean_string(company_name),
        location=location,
        snippet=description,
        raw_metadata={
            key: value
            for key, value in {
                "team": team,
                "site_name": clean_string(company_name),
            }.items()
            if value
        },
        confidence={"source_quality": 0.66},
    )


def _extract_greenhouse_jobs(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, dict):
        return []
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        return []
    return [item for item in jobs if isinstance(item, dict)]


def _extract_lever_jobs(payload: Any) -> list[dict[str, Any]]:
    if not isinstance(payload, list):
        return []
    return [item for item in payload if isinstance(item, dict)]


def _matches_search(search_text: str, *values: str | None) -> bool:
    haystack = " ".join(value for value in values if value).casefold()
    if not haystack:
        return True
    terms = [term.casefold() for term in search_text.split() if len(term) >= 3]
    return not terms or any(term in haystack for term in terms)


def _dedupe_items(items: list[DiscoveryAdapterItem]) -> list[DiscoveryAdapterItem]:
    seen: set[str] = set()
    result: list[DiscoveryAdapterItem] = []
    for item in items:
        key = item.external_id or item.source_url
        if key in seen:
            continue
        seen.add(key)
        result.append(item)
    return result


def _greenhouse_location(job: dict[str, Any]) -> str | None:
    offices = job.get("offices")
    if not isinstance(offices, list):
        return None
    names = [
        clean_string(office.get("name"))
        for office in offices
        if isinstance(office, dict)
    ]
    return ", ".join(name for name in names if name) or None


def _greenhouse_department(job: dict[str, Any]) -> str | None:
    departments = job.get("departments")
    if not isinstance(departments, list):
        return None
    for department in departments:
        if isinstance(department, dict):
            name = clean_string(department.get("name"))
            if name:
                return name
    return None
