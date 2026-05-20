from __future__ import annotations

from app.db.models.loop import Loop
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_sources.schemas import DiscoverySource


class ManualUrlAdapter:
    """Architecture-only adapter for manual URL sources.

    It performs no network access and produces no automatic source results.
    """

    source_id = "manual_url"

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(
        self,
        *,
        loop: Loop,
        source: DiscoverySource,
        options: DiscoveryAdapterOptions,
    ) -> DiscoveryAdapterResult:
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="skipped",
            warnings=["manual_url_requires_user_input"],
        )

