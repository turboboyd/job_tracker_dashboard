from __future__ import annotations

from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field

DiscoveryAdapterStatus = Literal["completed", "skipped", "failed"]
DiscoverySearchScope = Literal["focused", "normal", "broad"]


class DiscoveryAdapterOptions(BaseModel):
    model_config = ConfigDict(extra="forbid")

    dry_run: bool = True
    max_results: int = Field(default=20, ge=0, le=20)
    timeout_seconds: int = Field(default=8, ge=1, le=60)
    search_scope: DiscoverySearchScope = "normal"
    page: int = Field(default=1, ge=1, le=20)
    page_size: int = Field(default=20, ge=1, le=20)


class DiscoveryAdapterItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    external_id: str | None = None
    source_url: str
    title: str | None = None
    company: str | None = None
    location: str | None = None
    snippet: str | None = None
    posted_at: str | None = None
    raw_metadata: dict[str, Any] = Field(default_factory=dict)
    confidence: dict[str, float] = Field(default_factory=dict)


class DiscoveryAdapterResult(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str
    status: DiscoveryAdapterStatus
    items_previewed: int = 0
    items: list[DiscoveryAdapterItem] = Field(default_factory=list)
    warnings: list[str] = Field(default_factory=list)
    errors: list[str] = Field(default_factory=list)
    duration_ms: int | None = None
