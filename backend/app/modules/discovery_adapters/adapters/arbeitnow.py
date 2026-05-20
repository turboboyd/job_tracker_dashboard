from __future__ import annotations

from typing import Any

import httpx

from app.db.models.loop import Loop
from app.modules.discovery_adapters.adapters.utils import (
    clean_string,
    is_allowed_url,
    search_text_from_loop,
)
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource

ARBEITNOW_API_URL = "https://www.arbeitnow.com/api/job-board-api"
ARBEITNOW_SOURCE_PAGES_PER_PREVIEW_PAGE = 3


class ArbeitnowAdapter:
    source_id = "arbeitnow"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = ARBEITNOW_API_URL,
    ) -> None:
        self._client = client
        self._base_url = base_url

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        search_text = search_text_from_loop(loop)
        if not search_text:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["arbeitnow_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            for source_page in _source_pages_for_preview_page(options.page):
                payload = await self._fetch(page=source_page, options=options)
                jobs = _dedupe_jobs(
                    [
                        *jobs,
                        *_filter_jobs(
                            _extract_jobs(payload),
                            loop=loop,
                            search_text=search_text,
                        ),
                    ]
                )
                if len(jobs) >= options.page_size:
                    break
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitnow_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitnow_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitnow_invalid_response"],
            )

        items = [
            item for item in (map_arbeitnow_job(job) for job in jobs[: options.page_size]) if item
        ]

        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["arbeitnow_dry_run_preview_only"],
        )

    async def _fetch(self, *, page: int, options: DiscoveryAdapterOptions) -> dict[str, Any]:
        params = {"page": str(page)}
        if self._client is not None:
            response = await self._client.get(self._base_url, params=params)
            response.raise_for_status()
            return response.json()

        timeout = httpx.Timeout(options.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(self._base_url, params=params)
            response.raise_for_status()
            return response.json()


def map_arbeitnow_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("url"))
    if not is_allowed_url(source_url):
        return None

    tags = job.get("tags")
    tag_values = [clean_string(tag) for tag in tags] if isinstance(tags, list) else []
    tag_values = [tag for tag in tag_values if tag]
    job_types = job.get("job_types")
    job_type_values = (
        [clean_string(job_type) for job_type in job_types]
        if isinstance(job_types, list)
        else []
    )
    job_type_values = [job_type for job_type in job_type_values if job_type]

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("slug") or job.get("id")),
        source_url=source_url or "",
        title=clean_string(job.get("title")),
        company=clean_string(job.get("company_name")),
        location=clean_string(job.get("location")),
        snippet=clean_string(job.get("description"), max_length=800),
        posted_at=clean_string(job.get("created_at") or job.get("published_at")),
        raw_metadata={
            key: value
            for key, value in {
                "remote": job.get("remote") if isinstance(job.get("remote"), bool) else None,
                "tags": tag_values[:8],
                "job_types": job_type_values[:4],
                "source_attribution": "Arbeitnow",
            }.items()
            if value not in (None, [], "")
        },
        confidence={"source_quality": 0.7},
    )


def _extract_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError("invalid Arbeitnow response")
    return [item for item in data if isinstance(item, dict)]


def _source_pages_for_preview_page(preview_page: int) -> range:
    start = ((preview_page - 1) * ARBEITNOW_SOURCE_PAGES_PER_PREVIEW_PAGE) + 1
    end = start + ARBEITNOW_SOURCE_PAGES_PER_PREVIEW_PAGE
    return range(start, end)


def _filter_jobs(
    jobs: list[dict[str, Any]],
    *,
    loop: Loop,
    search_text: str,
) -> list[dict[str, Any]]:
    terms = _search_terms(search_text)
    location = clean_string(getattr(loop, "location", None))
    filtered: list[dict[str, Any]] = []

    for job in jobs:
        haystack = " ".join(
            str(value)
            for value in [
                job.get("title"),
                job.get("company_name"),
                job.get("location"),
                job.get("description"),
                " ".join(job.get("tags") or []) if isinstance(job.get("tags"), list) else "",
            ]
            if value
        ).casefold()
        if terms and not any(term in haystack for term in terms):
            continue
        if location and location.casefold() not in haystack:
            remote = job.get("remote")
            if remote is not True:
                continue
        filtered.append(job)
    return _dedupe_jobs(filtered)


def _search_terms(value: str) -> list[str]:
    words = [word.casefold() for word in value.split() if len(word) >= 3]
    return words[:5]


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("slug") or job.get("url") or job.get("id"))
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result
