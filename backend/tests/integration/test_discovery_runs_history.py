"""Integration tests for GET /api/v1/discovery-runs (run history list)."""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.session import get_db
from app.main import create_app

pytestmark = pytest.mark.asyncio(loop_scope="session")


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "discovery-history-uid",
    "email": "discovery-history@example.com",
    "display_name": "Discovery History User",
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


async def _create_loop(client: AsyncClient, title: str = "History Loop") -> str:
    r = await client.post(
        "/api/v1/loops",
        json={
            "title": title,
            "target_role": "Backend Engineer",
            "selected_sources": ["arbeitsagentur"],
            "auto_discovery_enabled": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def test_history_empty_when_no_runs(client):
    loop_id = await _create_loop(client)
    r = await client.get(
        "/api/v1/discovery-runs",
        params={"loop_id": loop_id},
        headers=_BEARER,
    )
    assert r.status_code == 200, r.text
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0


async def test_history_records_run(client):
    loop_id = await _create_loop(client, "Run Loop")
    # Trigger a real discovery run — only non-dry runs are persisted to history
    # (dry runs are user-initiated previews and would clutter the timeline).
    r = await client.post(
        "/api/v1/discovery-runs",
        json={"loop_id": loop_id, "dry_run": False, "source_ids": ["arbeitsagentur"]},
        headers=_BEARER,
    )
    assert r.status_code == 200, r.text

    history = await client.get(
        "/api/v1/discovery-runs",
        params={"loop_id": loop_id},
        headers=_BEARER,
    )
    assert history.status_code == 200, history.text
    body = history.json()
    assert body["total"] >= 1
    assert body["items"]
    first = body["items"][0]
    assert first["loop_id"] == loop_id
    assert first["status"] in {"completed", "completed_with_warnings", "failed", "skipped"}
    assert "started_at" in first
    assert "finished_at" in first
    assert isinstance(first["sources"], list)
    assert isinstance(first["items_found"], int)
    assert isinstance(first["duration_ms"], int)


async def test_history_rejects_invalid_loop_id(client):
    r = await client.get(
        "/api/v1/discovery-runs",
        params={"loop_id": "not-a-uuid"},
        headers=_BEARER,
    )
    assert r.status_code == 422
