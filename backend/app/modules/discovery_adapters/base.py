from __future__ import annotations

from typing import Protocol

from app.db.models.loop import Loop
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource


class DiscoveryAdapterError(Exception):
    """Safe adapter failure without leaking provider internals."""


class DiscoverySourceAdapter(Protocol):
    source_id: str

    def supports_source(self, source_id: str) -> bool:
        ...

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        ...

