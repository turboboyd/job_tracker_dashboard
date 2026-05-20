from __future__ import annotations

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

REMOTEJOBS_API_URL = "https://remotejobs.org/api/v1/jobs"


class RemoteJobsAdapter:
    source_id = "remotejobs"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = REMOTEJOBS_API_URL,
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
        search_queries = build_remotejobs_search_queries(
            loop,
            search_scope=options.search_scope,
        )
        if not search_queries:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["remotejobs_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            for query in search_queries:
                payload = await self._fetch(
                    params={
                        "q": query,
                        "limit": str(options.page_size),
                        "offset": str((options.page - 1) * options.page_size),
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
                errors=["remotejobs_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remotejobs_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remotejobs_invalid_response"],
            )

        items = [
            item for item in (map_remotejobs_job(job) for job in jobs[: options.page_size]) if item
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["remotejobs_dry_run_preview_only"],
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


def map_remotejobs_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("url") or job.get("apply_url"))
    if not is_allowed_url(source_url):
        return None

    company = job.get("company")
    company_name = (
        clean_string(company.get("name")) if isinstance(company, dict) else None
    )
    category = job.get("category")
    category_name = (
        clean_string(category.get("name")) if isinstance(category, dict) else None
    )
    category_slug = (
        clean_string(category.get("slug")) if isinstance(category, dict) else None
    )
    apply_url = clean_string(job.get("apply_url"))

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id")),
        source_url=source_url or "",
        title=clean_string(job.get("title")),
        company=company_name,
        location=clean_string(job.get("location")),
        snippet=clean_string(job.get("description"), max_length=800),
        posted_at=clean_string(job.get("posted_at")),
        raw_metadata={
            key: value
            for key, value in {
                "apply_url": apply_url if is_allowed_url(apply_url) else None,
                "category": category_name,
                "category_slug": category_slug,
                "job_type": clean_string(job.get("type")),
                "salary_text": clean_string(job.get("salary_text")),
                "is_translated": job.get("is_translated")
                if isinstance(job.get("is_translated"), bool)
                else None,
                "source_attribution": "RemoteJobs.org",
            }.items()
            if value not in (None, "")
        },
        confidence={"source_quality": 0.68},
    )


def build_remotejobs_search_queries(
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


def _extract_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    data = payload.get("data")
    if not isinstance(data, list):
        raise ValueError("invalid RemoteJobs response")
    return [item for item in data if isinstance(item, dict)]


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("id") or job.get("url") or job.get("apply_url"))
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result
