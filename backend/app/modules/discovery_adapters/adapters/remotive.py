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

REMOTIVE_API_URL = "https://remotive.com/api/remote-jobs"


class RemotiveAdapter:
    source_id = "remotive"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = REMOTIVE_API_URL,
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
        search_queries = build_remotive_search_queries(
            loop,
            search_scope=options.search_scope,
        )
        if not search_queries:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["remotive_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            target_count = options.page * options.page_size
            for query in search_queries:
                payload = await self._fetch(
                    params={
                        "search": query,
                        "limit": str(target_count),
                    },
                    options=options,
                )
                jobs = _dedupe_jobs([*jobs, *_extract_jobs(payload)])
                if len(jobs) >= target_count:
                    break
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remotive_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remotive_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["remotive_invalid_response"],
            )

        start = (options.page - 1) * options.page_size
        end = start + options.page_size
        items = [
            item
            for item in (
                map_remotive_job(job) for job in jobs[start:end]
            )
            if item is not None
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["remotive_dry_run_preview_only"],
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


def build_remotive_search_queries(
    loop: Loop,
    *,
    search_scope: str = "normal",
) -> list[str]:
    primary = search_text_from_loop(loop)
    if search_scope == "focused":
        candidates = [primary]
    elif search_scope == "broad":
        candidates = [
            primary,
            broad_role_text_from_loop(loop, max_length=60),
            *_role_keyword_fallbacks(loop),
        ]
    else:
        fallback_terms = compact_terms(
            [
                *(getattr(loop, "keywords", None) or []),
                getattr(loop, "target_role", None),
            ],
            limit=2,
            max_length=60,
        )
        candidates = [
            primary,
            clean_string(" ".join(fallback_terms), max_length=60),
            broad_role_text_from_loop(loop, max_length=60),
        ]

    queries: list[str] = []
    for query in candidates:
        if not query:
            continue
        if query.casefold() in {existing.casefold() for existing in queries}:
            continue
        queries.append(query)
    return queries[:3]


def map_remotive_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("url"))
    if not is_allowed_url(source_url):
        return None

    location = clean_string(job.get("candidate_required_location") or job.get("job_type"))
    snippet = clean_string(job.get("description"), max_length=800)
    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id")),
        source_url=source_url or "",
        title=clean_string(job.get("title")),
        company=clean_string(job.get("company_name")),
        location=location,
        snippet=snippet,
        posted_at=clean_string(job.get("publication_date")),
        raw_metadata={
            key: value
            for key, value in {
                "category": clean_string(job.get("category")),
                "salary": clean_string(job.get("salary")),
                "source_attribution": "Remotive",
            }.items()
            if value
        },
        confidence={"source_quality": 0.68},
    )


def _extract_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    jobs = payload.get("jobs")
    if not isinstance(jobs, list):
        return []
    return [item for item in jobs if isinstance(item, dict)]


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("id") or job.get("url"))
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result


def _role_keyword_fallbacks(loop: Loop) -> list[str]:
    role = broad_role_text_from_loop(loop, max_length=60)
    keywords = compact_terms(getattr(loop, "keywords", None) or [], limit=2, max_length=60)
    terms = compact_terms([role, *keywords], limit=4, max_length=60)
    if not terms:
        return []
    return [terms[0]]
