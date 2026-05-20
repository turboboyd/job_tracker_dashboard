"""Integration tests for application history endpoints.

Covers:
- GET /api/v1/applications/{id}/history
- POST /api/v1/applications/{id}/comments
- History creation side-effects of create / patch / status-change / archive
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
    "firebase_uid": "hist-test-uid-a",
    "email": "hist-usera@example.com",
    "display_name": "Hist User A",
    "photo_url": None,
}
_USER_B: DecodedFirebaseToken = {
    "firebase_uid": "hist-test-uid-b",
    "email": "hist-userb@example.com",
    "display_name": "Hist User B",
    "photo_url": None,
}

_BEARER = {"Authorization": "Bearer mock"}
_MINIMAL_APP = {"company_name": "Acme Corp", "role_title": "Backend Engineer"}


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
    response = await client.post(
        "/api/v1/loops",
        json={"title": title, "target_role": "Backend Engineer"},
        headers=_BEARER,
    )
    assert response.status_code == 201, response.text
    return response.json()["id"]


async def _create_app(client: AsyncClient) -> str:
    loop_id = await _create_loop(client)
    r = await client.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "loop_id": loop_id},
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


# ── APPLICATION_CREATED history ─────────────────────────────────────────────────


async def test_create_app_creates_history_item(client_a):
    app_id = await _create_app(client_a)
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 1
    assert body["limit"] == 20
    assert body["offset"] == 0
    items = body["items"]
    assert len(items) >= 1
    types = [i["type"] for i in items]
    assert "APPLICATION_CREATED" in types


async def test_history_item_has_correct_fields(client_a):
    app_id = await _create_app(client_a)
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    item = next(i for i in r.json()["items"] if i["type"] == "APPLICATION_CREATED")
    assert item["application_id"] == app_id
    assert item["actor"] == "user"
    assert "created_at" in item


# ── STATUS_CHANGE history ────────────────────────────────────────────────────────


async def test_status_change_creates_history(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    types = [i["type"] for i in r.json()["items"]]
    assert "STATUS_CHANGE" in types


async def test_status_change_records_from_and_to(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "INTERVIEW_1"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    item = next(i for i in r.json()["items"] if i["type"] == "STATUS_CHANGE")
    assert item["from_status"] == "SAVED"
    assert item["to_status"] == "INTERVIEW_1"


async def test_status_change_preserves_comment(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED", "comment": "Sent via LinkedIn"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    item = next(i for i in r.json()["items"] if i["type"] == "STATUS_CHANGE")
    assert item["comment"] == "Sent via LinkedIn"


async def test_status_change_preserves_correlation_id(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED", "correlation_id": "job-loop-xyz"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    item = next(i for i in r.json()["items"] if i["type"] == "STATUS_CHANGE")
    assert item["correlation_id"] == "job-loop-xyz"


# ── FIELD_CHANGE history ─────────────────────────────────────────────────────────


async def test_patch_creates_field_change_history(client_a):
    app_id = await _create_app(client_a)
    await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Staff Engineer"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    items = r.json()["items"]
    fc = next((i for i in items if i["type"] == "FIELD_CHANGE"), None)
    assert fc is not None
    assert fc["field_path"] == "role_title"
    assert fc["new_value"]["v"] == "Staff Engineer"
    assert fc["old_value"]["v"] == "Backend Engineer"


async def test_patch_no_change_no_field_change_history(client_a):
    app_id = await _create_app(client_a)
    # Send the same value that's already there
    await client_a.patch(
        f"/api/v1/applications/{app_id}",
        json={"role_title": "Backend Engineer"},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    items = r.json()["items"]
    fc_items = [i for i in items if i["type"] == "FIELD_CHANGE"]
    assert len(fc_items) == 0


# ── APPLICATION_ARCHIVED history ─────────────────────────────────────────────────


async def test_archive_creates_archived_history(client_a):
    app_id = await _create_app(client_a)
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)
    r = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    app_data = r.json()
    assert app_data["archived"] is True

    hist = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    types = [i["type"] for i in hist.json()["items"]]
    assert "APPLICATION_ARCHIVED" in types


# ── COMMENT history ───────────────────────────────────────────────────────────────


async def test_add_comment_creates_history(client_a):
    app_id = await _create_app(client_a)
    r = await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "Called HR today."},
        headers=_BEARER,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["type"] == "COMMENT"
    assert body["comment"] == "Called HR today."


async def test_add_comment_stores_metadata(client_a):
    app_id = await _create_app(client_a)
    r = await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={
            "text": "Got rejected.",
            "feedback_type": "rejection",
            "sentiment": "negative",
            "rejection_reason_code": "OVERQUALIFIED",
        },
        headers=_BEARER,
    )
    assert r.status_code == 201
    body = r.json()
    assert body["feedback_type"] == "rejection"
    assert body["sentiment"] == "negative"
    assert body["rejection_reason_code"] == "OVERQUALIFIED"


async def test_add_comment_appears_in_history_list(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "Follow-up email sent."},
        headers=_BEARER,
    )
    r = await client_a.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    types = [i["type"] for i in r.json()["items"]]
    assert "COMMENT" in types


async def test_add_comment_wrong_field_name_returns_422(client_a):
    """Contract: request body field is 'text', not 'comment'."""
    app_id = await _create_app(client_a)
    r = await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"comment": "This uses the wrong field name."},
        headers=_BEARER,
    )
    assert r.status_code == 422


async def test_add_comment_missing_text_returns_422(client_a):
    """'text' is a required field; empty body must fail validation."""
    app_id = await _create_app(client_a)
    r = await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={},
        headers=_BEARER,
    )
    assert r.status_code == 422


# ── Security ──────────────────────────────────────────────────────────────────────


async def test_history_requires_auth(db_session):
    app_obj = _make_app(db_session, _USER_A)
    async with AsyncClient(
        transport=ASGITransport(app=app_obj),
        base_url="http://test",
    ) as c:
        app_id = await _create_app(c)
        r = await c.get(f"/api/v1/applications/{app_id}/history")
    assert r.status_code == 401


async def test_history_other_user_is_404(client_a, client_b):
    app_id = await _create_app(client_a)
    r = await client_b.get(f"/api/v1/applications/{app_id}/history", headers=_BEARER)
    assert r.status_code == 404


async def test_comment_other_user_is_404(client_a, client_b):
    app_id = await _create_app(client_a)
    r = await client_b.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "sneaky comment"},
        headers=_BEARER,
    )
    assert r.status_code == 404


# ── pagination and filters ────────────────────────────────────────────────────────


async def test_history_limit_offset_and_total(client_a):
    app_id = await _create_app(client_a)
    for status_value in ("APPLIED", "INTERVIEW_1", "OFFER"):
        await client_a.post(
            f"/api/v1/applications/{app_id}/status",
            json={"to_status": status_value},
            headers=_BEARER,
        )

    r = await client_a.get(
        f"/api/v1/applications/{app_id}/history?limit=2&offset=1",
        headers=_BEARER,
    )

    assert r.status_code == 200
    body = r.json()
    assert body["total"] >= 4
    assert body["limit"] == 2
    assert body["offset"] == 1
    assert len(body["items"]) == 2


async def test_history_limit_over_max_returns_422(client_a):
    app_id = await _create_app(client_a)

    r = await client_a.get(
        f"/api/v1/applications/{app_id}/history?limit=101",
        headers=_BEARER,
    )

    assert r.status_code == 422


async def test_history_type_filter_returns_comments_only(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "Only comment."},
        headers=_BEARER,
    )
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )

    r = await client_a.get(
        f"/api/v1/applications/{app_id}/history?type=COMMENT",
        headers=_BEARER,
    )

    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert [item["type"] for item in body["items"]] == ["COMMENT"]


async def test_history_type_filter_returns_status_changes_only(client_a):
    app_id = await _create_app(client_a)
    await client_a.post(
        f"/api/v1/applications/{app_id}/comments",
        json={"text": "Not a status change."},
        headers=_BEARER,
    )
    await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )

    r = await client_a.get(
        f"/api/v1/applications/{app_id}/history?type=STATUS_CHANGE",
        headers=_BEARER,
    )

    assert r.status_code == 200
    body = r.json()
    assert body["total"] == 1
    assert [item["type"] for item in body["items"]] == ["STATUS_CHANGE"]
