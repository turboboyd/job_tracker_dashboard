from __future__ import annotations

import re
from typing import Any

import httpx

from app.db.models.loop import Loop
from app.modules.discovery_adapters.adapters.utils import (
    broad_role_text_from_loop,
    clean_string,
    compact_terms,
    is_allowed_url,
    search_text_from_loop,
)
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource

HIMALAYAS_SEARCH_API_URL = "https://himalayas.app/jobs/api/search"


class HimalayasAdapter:
    source_id = "himalayas"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = HIMALAYAS_SEARCH_API_URL,
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
        search_queries = build_himalayas_search_queries(
            loop,
            search_scope=options.search_scope,
        )
        if not search_queries:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["himalayas_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            for query in search_queries:
                payload = await self._fetch(
                    params={
                        "q": query,
                        "page": str(options.page),
                    },
                    options=options,
                )
                jobs = _dedupe_jobs([*jobs, *_extract_jobs(payload)])
                if jobs:
                    break
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["himalayas_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["himalayas_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["himalayas_invalid_response"],
            )

        items = [
            item for item in (map_himalayas_job(job) for job in jobs[: options.page_size]) if item
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["himalayas_dry_run_preview_only"],
        )

    async def _fetch(
        self,
        *,
        params: dict[str, str],
        options: DiscoveryAdapterOptions,
    ) -> dict[str, Any]:
        if self._client is not None:
            response = await self._client.get(self._base_url, params=params)
            response.raise_for_status()
            return response.json()

        timeout = httpx.Timeout(options.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(self._base_url, params=params)
            response.raise_for_status()
            return response.json()


def build_himalayas_search_queries(
    loop: Loop,
    *,
    search_scope: str = "normal",
) -> list[str]:
    primary = search_text_from_loop(loop)
    broad_role = broad_role_text_from_loop(loop, max_length=60)
    fallback_terms = compact_terms(
        [
            *(getattr(loop, "keywords", None) or []),
            getattr(loop, "target_role", None),
        ],
        limit=2,
        max_length=60,
    )
    fallback = clean_string(" ".join(fallback_terms), max_length=60)

    if search_scope == "focused":
        candidates = [primary]
    elif search_scope == "broad":
        candidates = [primary, broad_role, fallback]
    else:
        candidates = [primary, fallback, broad_role]

    queries: list[str] = []
    for query in candidates:
        if not query:
            continue
        if query.casefold() in {existing.casefold() for existing in queries}:
            continue
        queries.append(query)
    return queries[:3]


def map_himalayas_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("applicationLink"))
    if not is_allowed_url(source_url):
        return None

    location_restrictions = _string_values_from_objects(job.get("locationRestrictions"))
    timezone_restrictions = _string_values(job.get("timezoneRestrictions"))
    categories = _string_values(job.get("categories"))
    parent_categories = _string_values(job.get("parentCategories"))
    seniority = _string_values(job.get("seniority"))
    salary_text = _salary_text(job)

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("guid")),
        source_url=source_url or "",
        title=clean_string(job.get("title")),
        company=clean_string(job.get("companyName")),
        location=", ".join(location_restrictions) if location_restrictions else "Worldwide",
        snippet=clean_string(_strip_html(job.get("excerpt") or job.get("description")), max_length=800),
        posted_at=clean_string(job.get("pubDate")),
        raw_metadata={
            key: value
            for key, value in {
                "company_slug": clean_string(job.get("companySlug")),
                "employment_type": clean_string(job.get("employmentType")),
                "seniority": seniority[:4],
                "categories": categories[:6],
                "parent_categories": parent_categories[:4],
                "timezone_restrictions": timezone_restrictions[:6],
                "salary_text": salary_text,
                "source_attribution": "Himalayas",
            }.items()
            if value not in (None, [], "")
        },
        confidence={"source_quality": 0.68},
    )


def _extract_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        raise ValueError("invalid Himalayas response")
    return [item for item in jobs if isinstance(item, dict)]


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("guid") or job.get("applicationLink"))
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


def _string_values_from_objects(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    result: list[str] = []
    for item in value:
        if isinstance(item, str):
            cleaned = clean_string(item)
        elif isinstance(item, dict):
            cleaned = clean_string(item.get("name") or item.get("slug") or item.get("alpha2"))
        else:
            cleaned = None
        if cleaned:
            result.append(cleaned)
    return result


def _salary_text(job: dict[str, Any]) -> str | None:
    currency = clean_string(job.get("currency"))
    min_salary = job.get("minSalary")
    max_salary = job.get("maxSalary")
    if (
        not currency
        or not isinstance(min_salary, (int, float))
        or not isinstance(max_salary, (int, float))
    ):
        return None
    return f"{currency} {int(min_salary)}-{int(max_salary)}"


def _strip_html(value: Any) -> str | None:
    cleaned = clean_string(value)
    if not cleaned:
        return None
    return re.sub(r"<[^>]+>", " ", cleaned)
