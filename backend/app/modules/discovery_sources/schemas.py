from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

DiscoverySourceType = Literal["manual", "job_board", "company_site"]
DiscoverySourceConfigurationStatus = Literal[
    "ready",
    "not_configured",
    "not_runnable",
]


class DiscoverySourceCapabilities(BaseModel):
    model_config = ConfigDict(extra="forbid")

    manual_import: bool
    automatic_discovery: bool
    requires_credentials: bool
    supports_filters: bool


class DiscoverySource(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    name: str
    type: DiscoverySourceType
    enabled: bool
    description: str
    countries: list[str] = Field(default_factory=list)
    base_url: str | None = None
    capabilities: DiscoverySourceCapabilities


class DiscoverySourceListResponse(BaseModel):
    items: list[DiscoverySource]


class DiscoverySourceRuntimeStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_id: str = Field(..., pattern=r"^[a-z0-9_]+$")
    name: str
    automatic_discovery: bool
    configured: bool
    runnable: bool
    configuration_status: DiscoverySourceConfigurationStatus
    message_code: str


class DiscoverySourceRuntimeStatusResponse(BaseModel):
    items: list[DiscoverySourceRuntimeStatus]
