from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator

DiscoveryRunStatus = Literal["completed", "completed_with_warnings", "failed", "skipped"]
DiscoveryRunItemStatus = Literal["skipped", "unsupported", "would_run", "failed"]
DiscoverySearchScope = Literal["focused", "normal", "broad"]


class DiscoveryRunRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    loop_id: str | None = Field(default=None, min_length=1, max_length=64)
    dry_run: bool = True
    source_ids: list[str] | None = None
    search_scope: DiscoverySearchScope = "normal"
    page: int = Field(default=1, ge=1, le=20)
    page_size: int = Field(default=20, ge=1, le=20)
    # When True the run serves ONLY from the preview cache and never performs a
    # synchronous external fetch on a cache miss. User-facing feeds set this so
    # browsing the Search tab never hammers external job boards — missing pages
    # are warmed in the background / by the scheduler instead.
    cache_only: bool = False

    @field_validator("source_ids")
    @classmethod
    def normalize_source_ids(cls, value: list[str] | None) -> list[str] | None:
        if value is None:
            return None
        seen: set[str] = set()
        normalized: list[str] = []
        for item in value:
            source_id = item.strip()
            if not source_id:
                continue
            if source_id in seen:
                continue
            seen.add(source_id)
            normalized.append(source_id)
        return normalized


class DiscoveryRunItem(BaseModel):
    loop_id: str
    source_id: str | None = None
    status: DiscoveryRunItemStatus
    reason: str
    message: str
    items_previewed: int = 0
    has_more: bool = False
    preview_items: list["DiscoveryRunPreviewItem"] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)


class DiscoveryRunPreviewInsight(BaseModel):
    """Lightweight, read-time heuristic 'fit' breakdown for a preview item.

    Computed on the fly against the loop's current role/keywords/location (never
    cached) so the user gets an at-a-glance relevance read *before* saving a
    vacancy — without any external/LLM call.
    """

    score: float = 0.0
    matched: list[str] = Field(default_factory=list)
    missing: list[str] = Field(default_factory=list)


class DiscoveryRunPreviewItem(BaseModel):
    external_id: str | None = None
    source_url: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    snippet: str | None = None
    posted_at: str | None = None
    raw_metadata: dict = Field(default_factory=dict)
    confidence: dict[str, float] = Field(default_factory=dict)
    insight: DiscoveryRunPreviewInsight | None = None


class DiscoveryRunResponse(BaseModel):
    run_id: str
    status: DiscoveryRunStatus
    dry_run: bool
    page: int = 1
    page_size: int = 5
    loops_checked: int
    sources_checked: int
    matches_created: int
    matches_previewed: int
    warnings: list[str]
    items: list[DiscoveryRunItem]


class DiscoveryRunHistoryItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    run_id: str
    loop_id: str
    status: DiscoveryRunStatus
    sources: list[str]
    items_found: int
    items_new: int
    duration_ms: int
    error_text: str | None
    started_at: datetime
    finished_at: datetime


class DiscoveryRunHistoryResponse(BaseModel):
    items: list[DiscoveryRunHistoryItem]
    total: int
    limit: int
    offset: int
