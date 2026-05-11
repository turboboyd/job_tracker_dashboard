"""Integration tests for GET /api/v1/users/me and PATCH /api/v1/users/me.

Uses a real PostgreSQL database. Firebase token verification is mocked via
dependency_overrides — no real Firebase credentials are needed.

Set TEST_DATABASE_URL to point to a dedicated test database (recommended).
"""
from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

# All async tests in this module share the session event loop so they can
# use the session-scoped engine and schema fixtures without loop mismatches.
pytestmark = pytest.mark.asyncio(loop_scope="session")

from app.auth.firebase import DecodedFirebaseToken, IFirebaseVerifier, get_verifier
from app.db.session import get_db
from app.main import create_app


# ── Mock verifiers ──────────────────────────────────────────────────────────


class _MockVerifier:
    """Returns a fixed decoded token for any non-empty token string."""

    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


class _RejectVerifier:
    """Always raises ValueError — simulates an invalid / expired token."""

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        raise ValueError("Invalid token")


class _NotConfiguredVerifier:
    """Always raises RuntimeError — simulates Firebase Admin SDK not initialised."""

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        raise RuntimeError("Firebase credentials not configured")


# ── Default test identity ───────────────────────────────────────────────────

_DEFAULT_USER: DecodedFirebaseToken = {
    "firebase_uid": "integ-test-uid-default",
    "email": "user@example.com",
    "display_name": "Test User",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock-token"}


# ── App factory ─────────────────────────────────────────────────────────────


def _make_app(session: AsyncSession, verifier: IFirebaseVerifier):
    """Return a FastAPI app with DB and Firebase auth overridden for tests."""
    app = create_app()

    async def _db_override():
        yield session

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_verifier] = lambda: verifier
    return app


# ── Shared client fixture ───────────────────────────────────────────────────


@pytest_asyncio.fixture
async def client(db_session):
    """Async HTTP client wired to the default mock verifier."""
    app = _make_app(db_session, _MockVerifier(_DEFAULT_USER))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


# ── GET /api/v1/users/me ────────────────────────────────────────────────────


async def test_get_me_no_authorization_header_returns_401(db_session):
    app = _make_app(db_session, _MockVerifier(_DEFAULT_USER))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/users/me")
    assert r.status_code == 401


async def test_get_me_invalid_token_returns_401(db_session):
    app = _make_app(db_session, _RejectVerifier())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/users/me", headers={"Authorization": "Bearer bad"})
    assert r.status_code == 401


async def test_get_me_firebase_not_configured_returns_503(db_session):
    """If Firebase Admin SDK is not initialised the API must return 503, not 500."""
    app = _make_app(db_session, _NotConfiguredVerifier())
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.get("/api/v1/users/me", headers={"Authorization": "Bearer any-token"})
    assert r.status_code == 503


async def test_get_me_valid_token_creates_user_and_returns_200(client):
    r = await client.get("/api/v1/users/me", headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    assert body["firebase_uid"] == _DEFAULT_USER["firebase_uid"]
    assert body["email"] == _DEFAULT_USER["email"]
    assert body["display_name"] == _DEFAULT_USER["display_name"]
    assert "id" in body
    assert "created_at" in body
    assert "updated_at" in body


async def test_get_me_repeated_call_returns_same_user_no_duplicate(client):
    r1 = await client.get("/api/v1/users/me", headers=_BEARER)
    r2 = await client.get("/api/v1/users/me", headers=_BEARER)
    assert r1.status_code == 200
    assert r2.status_code == 200
    assert r1.json()["id"] == r2.json()["id"]


async def test_get_me_changed_firebase_profile_syncs_email_and_display_name(db_session):
    """First call creates the user; second call with updated Firebase data syncs fields."""
    original: DecodedFirebaseToken = {
        "firebase_uid": "integ-test-uid-sync",
        "email": "before@example.com",
        "display_name": "Before",
        "photo_url": None,
    }
    updated: DecodedFirebaseToken = {
        "firebase_uid": "integ-test-uid-sync",
        "email": "after@example.com",
        "display_name": "After",
        "photo_url": None,
    }

    app1 = _make_app(db_session, _MockVerifier(original))
    async with AsyncClient(transport=ASGITransport(app=app1), base_url="http://test") as c:
        r1 = await c.get("/api/v1/users/me", headers=_BEARER)
    assert r1.status_code == 200
    user_id = r1.json()["id"]

    app2 = _make_app(db_session, _MockVerifier(updated))
    async with AsyncClient(transport=ASGITransport(app=app2), base_url="http://test") as c:
        r2 = await c.get("/api/v1/users/me", headers=_BEARER)
    assert r2.status_code == 200
    body = r2.json()
    assert body["id"] == user_id
    assert body["email"] == "after@example.com"
    assert body["display_name"] == "After"


# ── PATCH /api/v1/users/me ──────────────────────────────────────────────────


async def test_patch_me_updates_all_allowed_fields(client):
    await client.get("/api/v1/users/me", headers=_BEARER)

    r = await client.patch(
        "/api/v1/users/me",
        json={"language": "en", "timezone": "UTC", "date_format": "MM/DD/YYYY", "display_name": "Patched"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    body = r.json()
    assert body["language"] == "en"
    assert body["timezone"] == "UTC"
    assert body["date_format"] == "MM/DD/YYYY"
    assert body["display_name"] == "Patched"


async def test_patch_me_partial_update_leaves_other_fields_at_defaults(client):
    await client.get("/api/v1/users/me", headers=_BEARER)

    r = await client.patch("/api/v1/users/me", json={"language": "de"}, headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    assert body["language"] == "de"
    assert body["timezone"] == "Europe/Berlin"  # default unchanged


async def test_patch_me_protected_field_rejected_with_422(client):
    await client.get("/api/v1/users/me", headers=_BEARER)

    r = await client.patch(
        "/api/v1/users/me",
        json={"firebase_uid": "hacker-uid"},
        headers=_BEARER,
    )
    assert r.status_code == 422


async def test_patch_me_no_authorization_returns_401(db_session):
    app = _make_app(db_session, _MockVerifier(_DEFAULT_USER))
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        r = await c.patch("/api/v1/users/me", json={"language": "en"})
    assert r.status_code == 401
