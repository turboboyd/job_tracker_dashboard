from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.db.models.loop import Loop
from app.modules.discovery_adapters.adapters.utils import (
    broad_role_text_from_loop,
    clean_string,
    compact_terms,
    is_allowed_url,
    location_from_loop,
    search_text_from_loop,
)
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource

ADZUNA_API_BASE_URL = "https://api.adzuna.com/v1/api/jobs/de/search"


class AdzunaAdapter:
    source_id = "adzuna"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        app_id: str | None = None,
        app_key: str | None = None,
        base_url: str = ADZUNA_API_BASE_URL,
    ) -> None:
        settings = None
        if app_id is None or app_key is None:
            settings = get_settings()
        self._client = client
        self._app_id = app_id if app_id is not None else getattr(settings, "ADZUNA_APP_ID", "")
        self._app_key = app_key if app_key is not None else getattr(settings, "ADZUNA_APP_KEY", "")
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
        if not self._app_id or not self._app_key:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["adzuna_not_configured"],
            )

        query_candidates = build_adzuna_query_candidates(
            loop,
            options=options,
            app_id=self._app_id,
            app_key=self._app_key,
        )
        if not query_candidates:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["adzuna_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            for params in query_candidates:
                payload = await self._fetch(params=params, options=options)
                jobs = _dedupe_jobs([*jobs, *_extract_results(payload)])
                if len(jobs) >= options.max_results:
                    break
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["adzuna_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["adzuna_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["adzuna_invalid_response"],
            )

        items = [
            item
            for item in (
                map_adzuna_job(job) for job in jobs[: options.max_results]
            )
            if item is not None
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["adzuna_dry_run_preview_only"],
        )

    async def _fetch(
        self,
        *,
        params: dict[str, str],
        options: DiscoveryAdapterOptions,
    ) -> dict[str, Any]:
        if self._client is not None:
            response = await self._client.get(self._url_for_page(options.page), params=params)
            response.raise_for_status()
            return response.json()

        timeout = httpx.Timeout(options.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(self._url_for_page(options.page), params=params)
            response.raise_for_status()
            return response.json()

    def _url_for_page(self, page: int) -> str:
        base_url = self._base_url.rstrip("/")
        if base_url.rsplit("/", 1)[-1].isdigit():
            return base_url
        return f"{base_url}/{page}"


def build_adzuna_query_candidates(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
    app_id: str,
    app_key: str,
) -> list[dict[str, str]]:
    location = location_from_loop(loop)
    candidates: list[str | None] = [search_text_from_loop(loop)]

    if options.search_scope != "focused":
        fallback_terms = compact_terms(
            [
                *(getattr(loop, "keywords", None) or []),
                getattr(loop, "target_role", None),
            ],
            limit=2,
            max_length=80,
        )
        candidates.extend(
            [
                clean_string(" ".join(fallback_terms), max_length=80),
                broad_role_text_from_loop(loop, max_length=80),
            ],
        )

    params_list: list[dict[str, str]] = []
    seen: set[str] = set()
    for search_text in candidates:
        normalized = (search_text or "").casefold()
        if normalized in seen:
            continue
        seen.add(normalized)
        if not search_text and not location:
            continue
        params = {
            "app_id": app_id,
            "app_key": app_key,
            "results_per_page": str(options.max_results),
            "content-type": "application/json",
        }
        if search_text:
            params["what"] = search_text
        if location:
            params["where"] = location
        params_list.append(params)
        if len(params_list) >= 3:
            break

    return params_list


def map_adzuna_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    source_url = clean_string(job.get("redirect_url") or job.get("adref"))
    if not is_allowed_url(source_url):
        return None

    company_obj = job.get("company")
    company = None
    if isinstance(company_obj, dict):
        company = clean_string(company_obj.get("display_name"))

    location = None
    location_obj = job.get("location")
    if isinstance(location_obj, dict):
        location = clean_string(location_obj.get("display_name"))

    return DiscoveryAdapterItem(
        external_id=clean_string(job.get("id")),
        source_url=source_url or "",
        title=clean_string(job.get("title")),
        company=company,
        location=location,
        snippet=clean_string(job.get("description"), max_length=800),
        posted_at=clean_string(job.get("created")),
        raw_metadata={
            key: value
            for key, value in {
                "category": _nested_display_name(job.get("category")),
                "contract_type": clean_string(job.get("contract_type")),
            }.items()
            if value
        },
        confidence={"source_quality": 0.72},
    )


def _extract_results(payload: dict[str, Any]) -> list[dict[str, Any]]:
    results = payload.get("results")
    if not isinstance(results, list):
        return []
    return [item for item in results if isinstance(item, dict)]


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(job.get("id") or job.get("redirect_url") or job.get("adref"))
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result


def _nested_display_name(value: Any) -> str | None:
    if not isinstance(value, dict):
        return None
    return clean_string(value.get("label") or value.get("display_name"))
