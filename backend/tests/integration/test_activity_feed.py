"""Integration tests for the activity feed endpoint.

Covers:
- GET /api/v1/activity/feed
- Activity events created by application CRUD and status transitions
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.session import get_db
from app.main import create_app

pytestmark = pytest.mark.asyncio(loop_scope="session")

# ── Mock helpers ────────────────────────────────────────────────────────────────


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER_A: DecodedFirebaseToken = {
    "firebase_uid": "activity-test-uid-a",
    "email": "activity-usera@example.com",
    "display_name": "Activity User A",
    "photo_url": None,
}
_USER_B: DecodedFirebaseToken = {
    "firebase_uid": "activity-test-uid-b",
    "email": "activity-userb@example.com",
    "display_name": "Activity User B",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock"}
_MINIMAL_APP = {"company_name": "Globex", "role_title": "Python Developer"}


def _make_app(session: AsyncSession, user_data: DecodedFirebaseToken):
    app = create_app()

    async def _db():
        yield session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(user_data)
    return app


@pytest_asyncio.fixture
async def client_a(db_session):
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_A)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def client_b(db_session):
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_B)),
        base_url="http://test",
    ) as c:
        yield c


# ── Helper ──────────────────────────────────────────────────────────────────────


async def _create_loop(client: AsyncClient, title: str = "Default Loop") -> str:
    r = await client.post(
        "/api/v1/loops",
        json={"title": title, "target_role": "Backend Engineer"},
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _create_app(client: AsyncClient) -> str:
    loop_id = await _create_loop(client)
    r = await client.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "loop_id": loop_id},
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ── APPLICATION_CREATED activity ─────────────────────────────────────────────────


async def test_create_app_creates_activity_event(client_a):
    await _create_app(client_a)
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    assert r.status_code == 200
    kinds = [e["kind"] for e in r.json()["items"]]
    assert "APPLICATION_CREATED" in kinds


async def test_created_activity_event_has_correct_fields(client_a):
    app_id = await _create_app(client_a)
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    evt = next(e for e in r.json()["items"] if e["kind"] == "APPLICATION_CREATED")
    assert evt["application_id"] == app_id
    assert "title" in evt
    assert "created_at" in evt


# ── STATUS_CHANGED activity ────────────────────────────────────────────────────


async def test_status_change_creates_activity_event(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    kinds = [e["kind"] for e in r.json()["items"]]
    assert "STATUS_CHANGED" in kinds


async def test_status_changed_event_payload(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "OFFER"},
        headers=_BEARER,
    )
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    evt = next(e for e in r.json()["items"] if e["kind"] == "STATUS_CHANGED")
    assert evt["payload"]["to_status"] == "OFFER"


# ── APPLICATION_UPDATED activity ───────────────────────────────────────────────


async def test_patch_creates_updated_activity_event(client_a):
    app_id = await _create_app(client_a)
    await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Senior Python Dev"},
        headers=_BEARER,
    )
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    kinds = [e["kind"] for e in r.json()["items"]]
    assert "APPLICATION_UPDATED" in kinds


async def test_patch_no_real_change_no_updated_event(client_a):
    """Patching with the same value must not emit APPLICATION_UPDATED."""
    app_id = await _create_app(client_a)

    # Patch with value that equals the current value
    await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Python Developer"},
        headers=_BEARER,
    )
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    updated_evts = [e for e in r.json()["items"] if e["kind"] == "APPLICATION_UPDATED"]
    assert len(updated_evts) == 0


# ── COMMENT_ADDED activity ─────────────────────────────────────────────────────


async def test_comment_creates_activity_event(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "Followed up by email."},
        headers=_BEARER,
    )
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    kinds = [e["kind"] for e in r.json()["items"]]
    assert "COMMENT_ADDED" in kinds


# ── APPLICATION_ARCHIVED activity ──────────────────────────────────────────────


async def test_archive_creates_activity_event(client_a):
    app_id = await _create_app(client_a)
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)
    r = await client_a.get("/api/v1/activity/feed", headers=_BEARER)
    kinds = [e["kind"] for e in r.json()["items"]]
    assert "APPLICATION_ARCHIVED" in kinds


# ── Security ──────────────────────────────────────────────────────────────────


async def test_feed_requires_auth(db_session):
    app_obj = _make_app(db_session, _USER_A)
    async with AsyncClient(
        transport=ASGITransport(app=app_obj),
        base_url="http://test",
    ) as c:
        r = await c.get("/api/v1/activity/feed")
    assert r.status_code == 401


async def test_feed_isolates_between_users(client_a, client_b):
    """User B must not see User A's activity events."""
    await _create_app(client_a)

    r = await client_b.get("/api/v1/activity/feed", headers=_BEARER)
    assert r.status_code == 200
    assert r.json()["items"] == []


# ── limit parameter ──────────────────────────────────────────────────────────────


async def test_feed_limit_parameter(client_a):
    # Create multiple activity events
    for _ in range(3):
        await _create_app(client_a)

    r = await client_a.get("/api/v1/activity/feed?limit=2", headers=_BEARER)
    assert r.status_code == 200
    assert len(r.json()["items"]) <= 2


# ── kind filter ───────────────────────────────────────────────────────────────────


async def test_feed_kind_filter(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )

    r = await client_a.get(
        "/api/v1/activity/feed?kind=APPLICATION_CREATED",
        headers=_BEARER,
    )
    assert r.status_code == 200
    kinds = [e["kind"] for e in r.json()["items"]]
    assert all(k == "APPLICATION_CREATED" for k in kinds)
    assert "STATUS_CHANGED" not in kinds


async def test_feed_kind_filter_status_changed(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "INTERVIEW_1"},
        headers=_BEARER,
    )

    r = await client_a.get("/api/v1/activity/feed?kind=STATUS_CHANGED", headers=_BEARER)
    assert r.status_code == 200
    kinds = [e["kind"] for e in r.json()["items"]]
    assert all(k == "STATUS_CHANGED" for k in kinds)
    assert "APPLICATION_CREATED" not in kinds
