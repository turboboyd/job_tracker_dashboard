from __future__ import annotations

from typing import Any

import httpx

from app.db.models.loop import Loop
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_adapters.safety import MAX_RESULTS_PER_SOURCE
from app.modules.discovery_sources.schemas import DiscoverySource
from app.modules.discovery_adapters.adapters.utils import (
    broad_role_text_from_loop,
    clean_string,
    compact_terms,
    is_allowed_url,
    location_from_loop,
)

ARBEITSAGENTUR_API_BASE_URL = (
    "https://rest.arbeitsagentur.de/jobboerse/jobsuche-service"
)
ARBEITSAGENTUR_JOBS_PATH = "/pc/v4/jobs"
ARBEITSAGENTUR_PUBLIC_CLIENT_ID = "jobboerse-jobsuche"


class ArbeitsagenturAdapter:
    source_id = "arbeitsagentur"

    def __init__(
        self,
        *,
        client: httpx.AsyncClient | None = None,
        base_url: str = ARBEITSAGENTUR_API_BASE_URL,
    ) -> None:
        self._client = client
        self._base_url = base_url.rstrip("/")

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        query_candidates = build_arbeitsagentur_query_candidates(loop, options=options)
        if not query_candidates:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="skipped",
                warnings=["arbeitsagentur_requires_search_terms"],
            )

        try:
            jobs: list[dict[str, Any]] = []
            for params in query_candidates:
                payload = await self._fetch_jobs(params=params, options=options)
                jobs = _dedupe_jobs([*jobs, *_extract_jobs(payload)])
                if len(jobs) >= options.max_results:
                    break
        except httpx.TimeoutException:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitsagentur_timeout"],
            )
        except (httpx.HTTPStatusError, httpx.RequestError):
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitsagentur_api_unavailable"],
            )
        except ValueError:
            return DiscoveryAdapterResult(
                source_id=source.id,
                status="failed",
                errors=["arbeitsagentur_invalid_response"],
            )

        items = [
            item
            for item in (
                map_arbeitsagentur_job(job)
                for job in jobs[: options.max_results]
            )
            if item is not None
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
            warnings=["arbeitsagentur_dry_run_preview_only"],
        )

    async def _fetch_jobs(
        self,
        *,
        params: dict[str, str],
        options: DiscoveryAdapterOptions,
    ) -> dict[str, Any]:
        headers = {"X-API-Key": ARBEITSAGENTUR_PUBLIC_CLIENT_ID}
        url = f"{self._base_url}{ARBEITSAGENTUR_JOBS_PATH}"
        if self._client is not None:
            response = await self._client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()

        timeout = httpx.Timeout(options.timeout_seconds)
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.get(url, params=params, headers=headers)
            response.raise_for_status()
            return response.json()


def build_arbeitsagentur_query(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
) -> dict[str, str]:
    search_terms = build_arbeitsagentur_search_terms(loop, options=options)
    return _build_arbeitsagentur_query(loop, options=options, search_terms=search_terms)


def build_arbeitsagentur_query_candidates(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
) -> list[dict[str, str]]:
    candidates: list[dict[str, str]] = []
    seen: set[tuple[tuple[str, str], ...]] = set()
    for search_terms in build_arbeitsagentur_search_term_sets(loop, options=options):
        params = _build_arbeitsagentur_query(
            loop,
            options=options,
            search_terms=search_terms,
        )
        if "was" not in params and "wo" not in params:
            continue
        _append_unique_query_candidate(candidates, seen, params)
        if len(candidates) >= 3:
            return candidates

    if options.search_scope == "broad" and location_from_loop(loop):
        for search_terms in build_arbeitsagentur_search_term_sets(loop, options=options):
            params = _build_arbeitsagentur_query(
                loop,
                options=options,
                search_terms=search_terms,
                include_location=False,
            )
            if "was" not in params and "wo" not in params:
                continue
            _append_unique_query_candidate(candidates, seen, params)
            if len(candidates) >= 3:
                break
    return candidates


def _build_arbeitsagentur_query(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
    search_terms: list[str],
    include_location: bool = True,
) -> dict[str, str]:
    params = {
        "page": str(options.page),
        "size": str(min(options.max_results, MAX_RESULTS_PER_SOURCE)),
        "pav": "false",
        "angebotsart": "1",
    }

    if search_terms:
        params["was"] = " ".join(search_terms)[:120]

    location = location_from_loop(loop) if include_location else None
    if location:
        params["wo"] = location[:80]

    radius = getattr(loop, "discovery_radius_km", None) or getattr(loop, "radius_km", None)
    if isinstance(radius, int) and radius > 0 and location:
        params["umkreis"] = str(min(radius, 200))

    return params


def _append_unique_query_candidate(
    candidates: list[dict[str, str]],
    seen: set[tuple[tuple[str, str], ...]],
    params: dict[str, str],
) -> None:
    key = tuple(sorted(params.items()))
    if key in seen:
        return
    seen.add(key)
    candidates.append(params)


def build_arbeitsagentur_search_terms(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
) -> list[str]:
    if options.search_scope == "broad":
        return compact_terms([broad_role_text_from_loop(loop)], limit=1)

    limit = 5 if options.search_scope == "focused" else 4
    return compact_terms(
        [
            getattr(loop, "target_role", None),
            *(getattr(loop, "keywords", None) or []),
        ],
        limit=limit,
    )


def build_arbeitsagentur_search_term_sets(
    loop: Loop,
    *,
    options: DiscoveryAdapterOptions,
) -> list[list[str]]:
    primary = build_arbeitsagentur_search_terms(loop, options=options)
    broad_role = compact_terms([broad_role_text_from_loop(loop)], limit=1)
    target_role = compact_terms([getattr(loop, "target_role", None)], limit=1)

    candidates = [primary]
    if options.search_scope != "focused":
        candidates.extend([broad_role, target_role])

    result: list[list[str]] = []
    seen: set[str] = set()
    for terms in candidates:
        normalized = " ".join(terms).casefold()
        if not normalized or normalized in seen:
            continue
        seen.add(normalized)
        result.append(terms)
    if not result and location_from_loop(loop):
        result.append([])
    return result


def map_arbeitsagentur_job(job: dict[str, Any]) -> DiscoveryAdapterItem | None:
    refnr = clean_string(
        job.get("refnr")
        or job.get("referenznummer")
        or job.get("id")
        or job.get("hashId")
    )
    title = clean_string(job.get("titel") or job.get("beruf"))
    source_url = clean_string(
        job.get("externeUrl") or job.get("url") or job.get("link")
    )
    if source_url and not is_allowed_url(source_url):
        source_url = None
    if not source_url and refnr:
        source_url = f"https://www.arbeitsagentur.de/jobsuche/jobdetail/{refnr}"
    if not source_url:
        return None

    company = clean_string(job.get("arbeitgeber") or job.get("firma"))
    location = _location_from_job(job)
    snippet = clean_string(
        job.get("stellenbeschreibung")
        or job.get("beschreibung")
        or job.get("kurzbeschreibung")
    )
    posted_at = clean_string(
        job.get("aktuelleVeroeffentlichungsdatum")
        or job.get("veroeffentlichtAm")
        or job.get("eintrittsdatum")
    )

    raw_metadata = {
        key: value
        for key, value in {
            "refnr": refnr,
            "beruf": clean_string(job.get("beruf")),
            "hash_id": clean_string(job.get("hashId")),
            "employment_type": _arbeitsagentur_employment(job),
        }.items()
        if value
    }
    return DiscoveryAdapterItem(
        external_id=refnr,
        source_url=source_url,
        title=title,
        company=company,
        location=location,
        snippet=snippet,
        posted_at=posted_at,
        raw_metadata=raw_metadata,
        confidence={"source_quality": 0.7},
    )


def _arbeitsagentur_employment(job: dict[str, Any]) -> str | None:
    value = job.get("arbeitszeitmodelle") or job.get("arbeitszeit")
    if isinstance(value, str):
        return clean_string(value)
    if isinstance(value, list):
        for entry in value:
            text = clean_string(entry) if isinstance(entry, str) else None
            if text:
                return text
    return None


def _extract_jobs(payload: dict[str, Any]) -> list[dict[str, Any]]:
    for key in ("stellenangebote", "jobs", "items"):
        value = payload.get(key)
        if isinstance(value, list):
            return [item for item in value if isinstance(item, dict)]
    return []


def _dedupe_jobs(jobs: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen: set[str] = set()
    result: list[dict[str, Any]] = []
    for job in jobs:
        key = clean_string(
            job.get("refnr")
            or job.get("referenznummer")
            or job.get("id")
            or job.get("hashId")
            or job.get("externeUrl")
            or job.get("url")
        )
        if not key:
            key = repr(sorted(job.items()))
        if key in seen:
            continue
        seen.add(key)
        result.append(job)
    return result


def _location_from_job(job: dict[str, Any]) -> str | None:
    location = job.get("arbeitsort") or job.get("arbeitsorte") or job.get("ort")
    if isinstance(location, str):
        return clean_string(location)
    if isinstance(location, dict):
        return clean_string(
            location.get("ort")
            or location.get("region")
            or location.get("name")
            or location.get("adresse")
        )
    if isinstance(location, list):
        values = [
            _location_from_job({"arbeitsort": item})
            for item in location
            if isinstance(item, (dict, str))
        ]
        return ", ".join(value for value in values if value) or None
    return None
