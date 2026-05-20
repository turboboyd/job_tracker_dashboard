from __future__ import annotations

from collections.abc import Iterable

from app.modules.discovery_adapters.schemas import DiscoveryAdapterItem

MAX_RESULTS_PER_SOURCE = 5
MAX_DISCOVERY_PREVIEW_PAGE = 20
REQUEST_TIMEOUT_SECONDS = 8
ALLOWED_URL_SCHEMES = frozenset({"http", "https"})


def limit_preview_items(
    items: Iterable[DiscoveryAdapterItem],
    *,
    max_results: int = MAX_RESULTS_PER_SOURCE,
) -> list[DiscoveryAdapterItem]:
    return list(items)[:max_results]
