from __future__ import annotations

from fastapi import APIRouter, Query

from app.core.config import get_settings
from app.modules.discovery_sources.registry import (
    list_discovery_source_runtime_statuses,
    list_discovery_sources,
)
from app.modules.discovery_sources.schemas import (
    DiscoverySourceListResponse,
    DiscoverySourceRuntimeStatusResponse,
)

router = APIRouter(prefix="/discovery-sources", tags=["discovery-sources"])


@router.get("", response_model=DiscoverySourceListResponse, summary="List discovery sources")
async def list_sources(
    enabled_only: bool = Query(default=False),
) -> DiscoverySourceListResponse:
    return DiscoverySourceListResponse(
        items=list_discovery_sources(enabled_only=enabled_only),
    )


@router.get(
    "/runtime-status",
    response_model=DiscoverySourceRuntimeStatusResponse,
    summary="List discovery source runtime configuration status",
)
async def list_source_runtime_statuses() -> DiscoverySourceRuntimeStatusResponse:
    return DiscoverySourceRuntimeStatusResponse(
        items=list_discovery_source_runtime_statuses(get_settings()),
    )
