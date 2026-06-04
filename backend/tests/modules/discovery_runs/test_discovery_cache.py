from __future__ import annotations

from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
from app.modules.discovery_adapters.registry import DiscoveryAdapterRegistry
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterResult,
)
from app.modules.discovery_runs.cache_repository import (
    DEFAULT_TTL_SECONDS,
    get_ttl_seconds,
    result_from_cache,
)
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopNotFoundError

USER_ID = uuid4()
LOOP_ID = UUID("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee")
SOURCE_ID = "safe_source"


# ── helpers ────────────────────────────────────────────────────────────────────


def make_db():
    """MagicMock AsyncSession whose execute() yields an empty result set.

    The service queries saved matches / preview ignores to filter the feed, so
    db.execute must be awaitable and return a row set (defaults to no rows).
    """
    mock = MagicMock()
    empty_result = MagicMock()
    empty_result.all.return_value = []
    mock.execute = AsyncMock(return_value=empty_result)
    return mock


def make_user():
    from app.db.models.user import User

    return User(
        id=USER_ID,
        firebase_uid="firebase-test",
        email="cache@test.com",
        display_name="Cache Tester",
        photo_url=None,
    )


def make_loop(**overrides):
    data = {
        "id": LOOP_ID,
        "user_id": USER_ID,
        "status": "active",
        "selected_sources": [SOURCE_ID],
        "auto_discovery_enabled": True,
        "last_discovery_at": None,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_source(source_id: str = SOURCE_ID):
    from app.modules.discovery_sources.schemas import DiscoverySource

    return DiscoverySource(
        id=source_id,
        name="Safe Source",
        type="job_board",
        enabled=True,
        description="Cache test source.",
        countries=["DE"],
        base_url="https://example.com/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    )


def make_items(n: int = 2) -> list[DiscoveryAdapterItem]:
    return [
        DiscoveryAdapterItem(
            external_id=f"job-{i}",
            source_url=f"https://example.com/jobs/{i}",
            title=f"Engineer {i}",
            company="Acme",
            location="Berlin",
            snippet="Python role.",
            raw_metadata={},
            confidence={},
        )
        for i in range(n)
    ]


def make_completed_result(n: int = 2) -> DiscoveryAdapterResult:
    return DiscoveryAdapterResult(
        source_id=SOURCE_ID,
        status="completed",
        items=make_items(n),
    )


def make_cache_entry(items=None, warnings=None) -> DiscoveryPreviewCache:
    now = datetime.now(timezone.utc)
    entry = DiscoveryPreviewCache()
    entry.source_id = SOURCE_ID
    entry.loop_id = LOOP_ID
    entry.search_scope = "normal"
    entry.page = 1
    entry.items_json = [item.model_dump() for item in (make_items(2) if items is None else items)]
    entry.warnings_json = [] if warnings is None else warnings
    entry.has_more = False
    entry.fetched_at = now
    entry.expires_at = now + timedelta(hours=1)
    entry.created_at = now
    entry.updated_at = now
    return entry


class FakeAdapter:
    source_id = SOURCE_ID

    def __init__(self, result: DiscoveryAdapterResult | None = None) -> None:
        self.result = result or make_completed_result()
        self.calls = 0

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(self, *, loop, source, options):
        self.calls += 1
        return self.result


class FakeLoopsService:
    def __init__(self, loop=None):
        self._loop = loop or make_loop()

    async def get_owned(self, user, loop_id):
        if self._loop.id == loop_id:
            return self._loop
        raise LoopNotFoundError()

    async def list_for_user(self, user, *, include_archived=False, limit=100, offset=0):
        return [self._loop], 1


def make_service(
    *,
    loop=None,
    adapter: FakeAdapter | None = None,
    db=None,
    source_id: str = SOURCE_ID,
) -> tuple[DiscoveryRunsService, FakeAdapter]:
    _adapter = adapter or FakeAdapter()
    registry = DiscoveryAdapterRegistry([_adapter])
    svc = DiscoveryRunsService(
        loops=FakeLoopsService(loop),
        adapter_registry=registry,
        db=db,
    )
    return svc, _adapter


# ── unit: cache TTL config ─────────────────────────────────────────────────────


def test_get_ttl_seconds_returns_source_specific_ttl():
    assert get_ttl_seconds("arbeitsagentur") == 4 * 3600
    assert get_ttl_seconds("greenhouse") == 6 * 3600
    assert get_ttl_seconds("arbeitnow") == 2 * 3600
    assert get_ttl_seconds("adzuna") == 1 * 3600


def test_get_ttl_seconds_returns_default_for_unknown_source():
    assert get_ttl_seconds("unknown_board") == DEFAULT_TTL_SECONDS


# ── unit: result_from_cache ────────────────────────────────────────────────────


def test_result_from_cache_reconstructs_adapter_result():
    entry = make_cache_entry(make_items(3), warnings=["some_warning"])
    result = result_from_cache(entry)

    assert result.source_id == SOURCE_ID
    assert result.status == "completed"
    assert len(result.items) == 3
    assert result.items[0].title == "Engineer 0"
    assert result.warnings == ["some_warning"]


def test_result_from_cache_handles_empty_items():
    entry = make_cache_entry(items=[], warnings=[])
    result = result_from_cache(entry)

    assert result.items == []
    assert result.warnings == []


# ── service: cache hit bypasses adapter ───────────────────────────────────────


@pytest.mark.asyncio
async def test_cache_hit_skips_adapter_call(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    db = make_db()
    cache_entry = make_cache_entry()
    svc, adapter = make_service(db=db)

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=cache_entry),
        ),
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ) as mock_upsert,
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert adapter.calls == 0
    assert result.sources_checked == 1
    assert result.items[0].status == "would_run"
    assert result.items[0].items_previewed == 2
    mock_upsert.assert_not_called()


# ── service: cache miss calls adapter and writes cache ────────────────────────


@pytest.mark.asyncio
async def test_cache_miss_calls_adapter_and_writes_cache(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    db = make_db()
    svc, adapter = make_service(db=db)

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=None),
        ),
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ) as mock_upsert,
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert adapter.calls == 1
    assert result.sources_checked == 1
    assert result.items[0].status == "would_run"
    mock_upsert.assert_called_once()


# ── service: no db → cache is skipped entirely ────────────────────────────────


@pytest.mark.asyncio
async def test_no_db_skips_cache_lookup_and_write(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    svc, adapter = make_service(db=None)

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(),
        ) as mock_get,
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ) as mock_upsert,
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert adapter.calls == 1
    mock_get.assert_not_called()
    mock_upsert.assert_not_called()
    assert result.sources_checked == 1


# ── service: failed adapter result is NOT cached ──────────────────────────────


@pytest.mark.asyncio
async def test_failed_adapter_result_is_not_cached(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    failed_result = DiscoveryAdapterResult(
        source_id=SOURCE_ID,
        status="failed",
        items=[],
        errors=["timeout"],
    )
    db = make_db()
    svc, adapter = make_service(
        db=db,
        adapter=FakeAdapter(result=failed_result),
    )

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=None),
        ),
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ) as mock_upsert,
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert result.items[0].status == "failed"
    mock_upsert.assert_not_called()


# ── service: skipped adapter result is NOT cached ─────────────────────────────


@pytest.mark.asyncio
async def test_skipped_adapter_result_is_not_cached(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    skipped_result = DiscoveryAdapterResult(
        source_id=SOURCE_ID,
        status="skipped",
        items=[],
        warnings=["no_keywords_configured"],
    )
    db = make_db()
    svc, adapter = make_service(
        db=db,
        adapter=FakeAdapter(result=skipped_result),
    )

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=None),
        ),
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ) as mock_upsert,
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert result.items[0].status == "skipped"
    mock_upsert.assert_not_called()


# ── service: cache write failure is non-fatal ─────────────────────────────────


@pytest.mark.asyncio
async def test_cache_write_failure_is_non_fatal(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    db = make_db()
    svc, adapter = make_service(db=db)

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=None),
        ),
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(side_effect=Exception("db went away")),
        ),
    ):
        result = await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID)),
        )

    assert result.items[0].status == "would_run"
    assert result.items[0].errors == []


# ── service: cache key separates scope and page ───────────────────────────────


@pytest.mark.asyncio
async def test_cache_lookup_passes_scope_and_page(monkeypatch):
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda sid: make_source(sid),
    )

    db = make_db()
    svc, _ = make_service(db=db)

    with (
        patch(
            "app.modules.discovery_runs.service.get_fresh_cache",
            new=AsyncMock(return_value=None),
        ) as mock_get,
        patch(
            "app.modules.discovery_runs.service.upsert_cache",
            new=AsyncMock(),
        ),
    ):
        await svc.run(
            make_user(),
            DiscoveryRunRequest(loop_id=str(LOOP_ID), search_scope="broad", page=3),
        )

    call_kwargs = mock_get.call_args.kwargs
    assert call_kwargs["search_scope"] == "broad"
    assert call_kwargs["page"] == 3
    assert call_kwargs["loop_id"] == LOOP_ID
    assert call_kwargs["source_id"] == SOURCE_ID
