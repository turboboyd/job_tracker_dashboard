"""Integration tests for discovery preview-cache retention (cleanup_stale).

Verifies the 30-day retention purge deletes only stale rows (keyed on
``fetched_at``) and leaves freshly-warmed rows — and never touches anything
outside discovery_preview_cache.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
from app.db.session import get_db
from app.main import create_app
from app.modules.discovery_runs.cache_repository import RETENTION_DAYS, cleanup_stale

pytestmark = pytest.mark.asyncio(loop_scope="session")


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "cache-retention-uid",
    "email": "cache-retention@example.com",
    "display_name": "Cache Retention User",
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
            "title": "Retention Loop",
            "target_role": "Backend Engineer",
            "selected_sources": ["arbeitsagentur"],
            "auto_discovery_enabled": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _cache_row(loop_id: str, *, page: int, fetched_at: datetime) -> DiscoveryPreviewCache:
    return DiscoveryPreviewCache(
        loop_id=loop_id,
        source_id="arbeitsagentur",
        search_scope="normal",
        page=page,
        items_json=[],
        warnings_json=[],
        has_more=False,
        fetched_at=fetched_at,
        expires_at=fetched_at + timedelta(hours=4),
        created_at=fetched_at,
        updated_at=fetched_at,
    )


async def test_cleanup_stale_purges_only_old_rows(client, db_session):
    loop_id = await _create_loop(client)
    now = datetime.now(timezone.utc)

    fresh = _cache_row(loop_id, page=1, fetched_at=now)
    just_inside = _cache_row(loop_id, page=2, fetched_at=now - timedelta(days=RETENTION_DAYS - 1))
    stale = _cache_row(loop_id, page=3, fetched_at=now - timedelta(days=RETENTION_DAYS + 10))
    db_session.add_all([fresh, just_inside, stale])
    await db_session.commit()

    deleted = await cleanup_stale(db_session, now=now)
    assert deleted == 1

    remaining = (
        await db_session.execute(
            select(DiscoveryPreviewCache.page)
            .where(DiscoveryPreviewCache.loop_id == loop_id)
            .order_by(DiscoveryPreviewCache.page)
        )
    ).scalars().all()
    assert remaining == [1, 2]


async def test_cleanup_stale_noop_when_all_fresh(client, db_session):
    loop_id = await _create_loop(client)
    now = datetime.now(timezone.utc)

    db_session.add(_cache_row(loop_id, page=1, fetched_at=now))
    await db_session.commit()

    deleted = await cleanup_stale(db_session, now=now)
    assert deleted == 0
