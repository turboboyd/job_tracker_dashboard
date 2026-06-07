"""Integration test for the discovery preview-cache warming cycle.

Exercises the *real* ``cache_repository`` against PostgreSQL and the actual
``warm_discovery_cache`` BackgroundTask end-to-end:

1. **Miss** — a ``cache_only`` run against a cold cache reports ``cache_warming``
   and writes nothing (the user-facing feed never blocks on external boards).
2. **Warm** — ``warm_discovery_cache`` fetches the source once (off the request
   path) and persists the result into ``discovery_preview_cache``.
3. **Hit** — a second ``cache_only`` run is served straight from the DB without
   touching the adapter.

Unlike the unit tests in ``test_discovery_cache.py`` (which mock
``get_fresh_cache``/``upsert_cache``), this drives the real SQL round-trips and
the real BackgroundTask, only stubbing the adapter so no external job board is
contacted.
"""

from __future__ import annotations

from uuid import UUID

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
from app.db.models.user import User
from app.db.session import get_db
from app.main import create_app
from app.modules.discovery_adapters.registry import DiscoveryAdapterRegistry
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterResult,
)
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.discovery_runs.warming import warm_discovery_cache
from app.modules.loops.service import LoopsService

pytestmark = pytest.mark.asyncio(loop_scope="session")

SOURCE_ID = "arbeitsagentur"


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "cache-warming-uid",
    "email": "cache-warming@example.com",
    "display_name": "Cache Warming User",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock"}


def _make_app(session: AsyncSession, user_data: DecodedFirebaseToken):
    app = create_app()

    async def _db():
        yield session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(user_data)
    return app


@pytest_asyncio.fixture
async def client(db_session):
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER)),
        base_url="http://test",
    ) as c:
        yield c


async def _create_loop(client: AsyncClient) -> str:
    r = await client.post(
        "/api/v1/loops",
        json={
            "title": "Warming Loop",
            "target_role": "Backend Engineer",
            "selected_sources": [SOURCE_ID],
            "auto_discovery_enabled": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _items(n: int = 2) -> list[DiscoveryAdapterItem]:
    return [
        DiscoveryAdapterItem(
            external_id=f"warm-{i}",
            source_url=f"https://example.com/jobs/{i}",
            title=f"Backend Engineer {i}",
            company="Acme",
            location="Berlin",
            snippet="Python role.",
            raw_metadata={},
            confidence={},
        )
        for i in range(n)
    ]


class _FakeAdapter:
    """Adapter stub that supports the real source id and counts discover() calls."""

    def __init__(self) -> None:
        self.calls = 0

    def supports_source(self, source_id: str) -> bool:
        return source_id == SOURCE_ID

    async def discover(self, *, loop, source, options) -> DiscoveryAdapterResult:
        self.calls += 1
        return DiscoveryAdapterResult(
            source_id=SOURCE_ID,
            status="completed",
            items=_items(2),
        )


def _make_service(db_session, adapter: _FakeAdapter) -> DiscoveryRunsService:
    return DiscoveryRunsService(
        loops=LoopsService(db_session),
        adapter_registry=DiscoveryAdapterRegistry([adapter]),
        db=db_session,
    )


async def test_cache_warming_cycle_miss_then_warm_then_hit(
    client, db_session, test_engine, monkeypatch
):
    loop_id = await _create_loop(client)
    # Commit so the loop + auto-provisioned user are visible to the separate
    # session that warm_discovery_cache opens for the BackgroundTask.
    await db_session.commit()
    loop_uuid = UUID(loop_id)

    user = (
        await db_session.execute(
            select(User).where(User.firebase_uid == _USER["firebase_uid"])
        )
    ).scalar_one()

    # ── Step 1: cold cache + cache_only → warming miss, nothing written ──
    miss_adapter = _FakeAdapter()
    miss = await _make_service(db_session, miss_adapter).run(
        user,
        DiscoveryRunRequest(loop_id=loop_id, source_ids=[SOURCE_ID], cache_only=True),
    )
    assert miss.items[0].status == "skipped"
    assert miss.items[0].reason == "cache_warming"
    assert miss_adapter.calls == 0  # cache_only never hits the network on a miss

    cache_count = (
        await db_session.execute(
            select(func.count())
            .select_from(DiscoveryPreviewCache)
            .where(DiscoveryPreviewCache.loop_id == loop_uuid)
        )
    ).scalar_one()
    assert cache_count == 0

    # ── Step 2: warm the cache via the real BackgroundTask ──
    # Point the task's own session factory at the test engine and inject a stub
    # adapter (the task builds its service with the default registry).
    warm_adapter = _FakeAdapter()
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_adapter_registry",
        lambda: DiscoveryAdapterRegistry([warm_adapter]),
    )
    monkeypatch.setattr(
        "app.modules.discovery_runs.warming.get_session_factory",
        lambda: async_sessionmaker(
            test_engine, class_=AsyncSession, expire_on_commit=False
        ),
    )
    await warm_discovery_cache(
        loop_id=loop_id,
        user_id=user.id,
        source_ids=[SOURCE_ID],
        search_scope="normal",
        page=1,
        page_size=20,
    )
    assert warm_adapter.calls == 1  # warming fetched the source exactly once

    # End the read transaction so the next statement sees the row warming
    # committed on its own connection. The fixture uses expire_on_commit=False,
    # so the already-loaded user/loop instances stay usable (no lazy-load IO).
    await db_session.commit()
    rows = (
        (
            await db_session.execute(
                select(DiscoveryPreviewCache).where(
                    DiscoveryPreviewCache.loop_id == loop_uuid
                )
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 1
    assert rows[0].source_id == SOURCE_ID
    assert rows[0].search_scope == "normal"
    assert rows[0].page == 1
    assert len(rows[0].items_json) == 2

    # ── Step 3: cache_only again → hit served from DB, adapter untouched ──
    hit_adapter = _FakeAdapter()
    hit = await _make_service(db_session, hit_adapter).run(
        user,
        DiscoveryRunRequest(loop_id=loop_id, source_ids=[SOURCE_ID], cache_only=True),
    )
    assert hit.items[0].status == "would_run"
    assert hit.items[0].items_previewed == 2
    assert hit_adapter.calls == 0  # served straight from cache
