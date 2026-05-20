from __future__ import annotations

import re
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

REMOTEOK_API_URL = "https://remoteok.com/api"


class RemoteOkAdapter:
    source_id = "remoteok"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = REMOTEOK_API_URL,
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
                warnings=["remoteok_requires_search_terms"],
            )

        try:
            payload = await self._fetch(options=options)
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remoteok_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remoteok_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remoteok_invalid_response"],
            )

        jobs = _filter_jobs(_extract_jobs(payload), search_text=search_text)
        start = (options.page - 1) * options.page_size
        items = [
            item
            for item in (
                map_remoteok_job(job) for job in jobs[start : start + options.page_size]
            )
            if item
        ]

        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["remoteok_dry_run_preview_only"],
        )

    async def _fetch(self, *, options: DiscoveryAdapterOptions) -> list[dict[str, Any]]:
        headers = {"User-Agent": "job-tracker-dashboard/preview"}
        if self._client is not None:
            response = await self._client.get(self._base_url, headers=headers)
            response.raise_for_status()
            return response.json()

        timeout = httpx.Timeout(options.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout, headers=headers) as client:
            response = await client.get(self._base_url)
            response.raise_for_status()
            return response.json()


def map_remoteok_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("url") or job.get("apply_url"))
    if not is_allowed_url(source_url):
        return None

    tags = _string_values(job.get("tags"))
    salary_text = _salary_text(job)

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id") or job.get("slug")),
        source_url=source_url or "",
        title=clean_string(job.get("position")),
        company=clean_string(job.get("company")),
        location=clean_string(job.get("location")) or "Remote",
        snippet=clean_string(_strip_html(job.get("description")), max_length=800),
        posted_at=clean_string(job.get("date")),
        raw_metadata={
            key: value
            for key, value in {
                "slug": clean_string(job.get("slug")),
                "tags": tags[:10],
                "salary_text": salary_text,
                "source_attribution": "Remote OK",
            }.items()
            if value not in (None, [], "")
        },
        confidence={"source_quality": 0.66},
    )


def _extract_jobs(payload: list[dict[str, Any]]) -> list[dict[str, Any]]:
    if not isinstance(payload, list):
        raise ValueError("invalid Remote OK response")
    return [
        item
        for item in payload
        if isinstance(item, dict) and ("id" in item or "url" in item)
    ]


def _filter_jobs(jobs: list[dict[str, Any]], *, search_text: str) -> list[dict[str, Any]]:
    terms = [word.casefold() for word in search_text.split() if len(word) >= 3][:5]
    filtered: list[dict[str, Any]] = []
    for job in jobs:
        haystack = " ".join(
            str(value)
            for value in [
                job.get("position"),
                job.get("company"),
                job.get("location"),
                job.get("description"),
                " ".join(job.get("tags") or []) if isinstance(job.get("tags"), list) else "",
            ]
            if value
        ).casefold()
        if terms and not any(term in haystack for term in terms):
            continue
        filtered.append(job)
    return _dedupe_jobs(filtered)


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("id") or job.get("url") or job.get("slug"))
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result


def _string_values(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [item for item in (clean_string(item) for item in value) if item]


def _salary_text(job: dict[str, Any]) -> str | None:
    min_salary = job.get("salary_min")
    max_salary = job.get("salary_max")
    if not isinstance(min_salary, (int, float)) or not isinstance(max_salary, (int, float)):
        return None
    if min_salary <= 0 and max_salary <= 0:
        return None
    return f"{int(min_salary)}-{int(max_salary)}"


def _strip_html(value: Any) -> str | None:
    cleaned = clean_string(value)
    if not cleaned:
        return None
    return re.sub(r"<[^>]+>", " ", cleaned)
