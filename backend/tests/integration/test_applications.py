"""Integration tests for /api/v1/applications CRUD.

Uses a real PostgreSQL database. Firebase auth is mocked via
dependency_overrides — no real credentials needed.
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

pytestmark = pytest.mark.asyncio(loop_scope="session")

from app.auth.firebase import DecodedFirebaseToken, IFirebaseVerifier, get_verifier
from app.db.session import get_db
from app.main import create_app


# ── Mock helpers ────────────────────────────────────────────────────────────────


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER_A: DecodedFirebaseToken = {
    "firebase_uid": "app-test-uid-a",
    "email": "usera@example.com",
    "display_name": "User A",
    "photo_url": None,
}
_USER_B: DecodedFirebaseToken = {
    "firebase_uid": "app-test-uid-b",
    "email": "userb@example.com",
    "display_name": "User B",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock"}

_MINIMAL_APP = {"company_name": "Acme Corp", "role_title": "Backend Engineer"}


# ── App factory ─────────────────────────────────────────────────────────────────


def _make_app(session: AsyncSession, user_data: DecodedFirebaseToken):
    app = create_app()

    async def _db():
        yield session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(user_data)
    return app


# ── Fixtures ────────────────────────────────────────────────────────────────────


@pytest_asyncio.fixture
async def client_a(db_session):
    """Client authenticated as User A."""
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_A)),
        base_url="http://test",
    ) as c:
        yield c


@pytest_asyncio.fixture
async def client_b(db_session):
    """Client authenticated as User B (different user, same session/DB)."""
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER_B)),
        base_url="http://test",
    ) as c:
        yield c


# ── POST /applications ──────────────────────────────────────────────────────────


async def test_create_requires_auth(db_session):
    app = _make_app(db_session, _USER_A)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.post("/api/v1/applications", json=_MINIMAL_APP)
    assert r.status_code == 401


async def test_create_minimal_returns_201(client_a):
    r = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    assert r.status_code == 201
    body = r.json()
    assert body["company_name"] == "Acme Corp"
    assert body["role_title"] == "Backend Engineer"
    assert body["status"] == "SAVED"
    assert body["archived"] is False
    assert "id" in body
    assert "created_at" in body


async def test_create_computes_stage(client_a):
    r = await client_a.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "status": "INTERVIEW_1"},
        headers=_BEARER,
    )
    assert r.status_code == 201
    assert r.json()["stage"] == "INTERVIEW"


async def test_create_full_payload(client_a):
    payload = {
        "company_name": "BigCo",
        "role_title": "Senior Python Dev",
        "status": "APPLIED",
        "location_text": "Berlin, Germany",
        "vacancy_url": "https://bigco.com/jobs/123",
        "work_mode": "HYBRID",
        "employment_type": "FULL_TIME",
        "salary": {"currency": "EUR", "min": 70000, "max": 90000},
        "applied_via": "linkedin",
        "current_note": "Looks promising",
        "tags": ["python", "remote"],
    }
    r = await client_a.post("/api/v1/applications", json=payload, headers=_BEARER)
    assert r.status_code == 201
    body = r.json()
    assert body["salary"]["currency"] == "EUR"
    assert body["tags"] == ["python", "remote"]
    assert body["stage"] == "ACTIVE"


async def test_create_protected_fields_rejected(client_a):
    """Sending derived or system fields must fail validation."""
    r = await client_a.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "stage": "INTERVIEW"},
        headers=_BEARER,
    )
    assert r.status_code == 422


# ── GET /applications ───────────────────────────────────────────────────────────


async def test_list_empty_initially(client_a):
    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    assert r.json() == []


async def test_list_returns_created_application(client_a):
    await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    assert len(r.json()) >= 1
    assert r.json()[0]["company_name"] == "Acme Corp"


async def test_list_excludes_archived_by_default(client_a):
    # Create and immediately archive an application
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)

    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    ids = [a["id"] for a in r.json()]
    assert app_id not in ids


async def test_list_archived_returns_archived(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)

    r = await client_a.get("/api/v1/applications?archived=true", headers=_BEARER)
    assert r.status_code == 200
    ids = [a["id"] for a in r.json()]
    assert app_id in ids


async def test_list_filters_by_status(client_a):
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "APPLIED"}, headers=_BEARER
    )
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "OFFER"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?status=APPLIED", headers=_BEARER)
    statuses = [a["status"] for a in r.json()]
    assert all(s == "APPLIED" for s in statuses)


async def test_list_isolates_between_users(client_a, client_b):
    """User B must not see User A's applications."""
    await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)

    r = await client_b.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    assert r.json() == []


# ── GET /applications/{id} ──────────────────────────────────────────────────────


async def test_get_by_id_returns_application(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 200
    assert r.json()["id"] == app_id


async def test_get_by_id_not_found(client_a):
    r = await client_a.get(
        "/api/v1/applications/00000000-0000-0000-0000-000000000000", headers=_BEARER
    )
    assert r.status_code == 404


async def test_get_by_id_other_user_is_404(client_a, client_b):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_b.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 404


# ── PATCH /applications/{id} ────────────────────────────────────────────────────


async def test_patch_updates_fields(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Staff Engineer", "current_note": "Updated note"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["role_title"] == "Staff Engineer"
    assert body["current_note"] == "Updated note"


async def test_patch_status_change_updates_stage_and_timestamp(client_a):
    cr = await client_a.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "status": "APPLIED"},
        headers=_BEARER,
    )
    app_id = cr.json()["id"]
    original_ts = cr.json()["last_status_change_at"]

    r = await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"status": "INTERVIEW_1"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "INTERVIEW_1"
    assert body["stage"] == "INTERVIEW"
    assert body["last_status_change_at"] != original_ts


async def test_patch_derived_fields_rejected(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"stage": "OFFER"},
        headers=_BEARER,
    )
    assert r.status_code == 422


async def test_patch_not_found(client_a):
    r = await client_a.patch(
        "/api/v1/applications/00000000-0000-0000-0000-000000000000",
        json={"role_title": "X"},
        headers=_BEARER,
    )
    assert r.status_code == 404


async def test_patch_other_user_is_404(client_a, client_b):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_b.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Hacked"},
        headers=_BEARER,
    )
    assert r.status_code == 404


# ── DELETE /applications/{id} ───────────────────────────────────────────────────


async def test_delete_archives_application(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 204

    detail = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert detail.status_code == 200
    assert detail.json()["archived"] is True


async def test_delete_not_found(client_a):
    r = await client_a.delete(
        "/api/v1/applications/00000000-0000-0000-0000-000000000000", headers=_BEARER
    )
    assert r.status_code == 404


async def test_delete_other_user_is_404(client_a, client_b):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_b.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 404
    # Verify User A's application was not touched
    detail = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert detail.json()["archived"] is False
