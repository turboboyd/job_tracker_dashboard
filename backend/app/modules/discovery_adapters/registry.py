from __future__ import annotations

from app.modules.discovery_adapters.adapters.adzuna import AdzunaAdapter
from app.modules.discovery_adapters.adapters.arbeitsagentur import ArbeitsagenturAdapter
from app.modules.discovery_adapters.adapters.arbeitnow import ArbeitnowAdapter
from app.modules.discovery_adapters.adapters.ats import GreenhouseAdapter, LeverAdapter
from app.modules.discovery_adapters.adapters.himalayas import HimalayasAdapter
from app.modules.discovery_adapters.adapters.manual_url import ManualUrlAdapter
from app.modules.discovery_adapters.adapters.remotive import RemotiveAdapter
from app.modules.discovery_adapters.adapters.remotejobs import RemoteJobsAdapter
from app.modules.discovery_adapters.adapters.remoteok import RemoteOkAdapter
from app.modules.discovery_adapters.base import DiscoverySourceAdapter


class DiscoveryAdapterRegistry:
    def __init__(self, adapters: list[DiscoverySourceAdapter] | None = None) -> None:
        self._adapters = adapters or []

    def get_adapter(self, source_id: str) -> DiscoverySourceAdapter | None:
        for adapter in self._adapters:
            if adapter.supports_source(source_id):
                return adapter
        return None


def get_discovery_adapter_registry() -> DiscoveryAdapterRegistry:
    return DiscoveryAdapterRegistry(
        [
            ManualUrlAdapter(),
            ArbeitsagenturAdapter(),
            ArbeitnowAdapter(),
            AdzunaAdapter(),
            RemotiveAdapter(),
            RemoteJobsAdapter(),
            HimalayasAdapter(),
            RemoteOkAdapter(),
            GreenhouseAdapter(),
            LeverAdapter(),
        ]
    )
