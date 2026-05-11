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
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["limit"] == 50
    assert body["offset"] == 0


async def test_list_returns_created_application(client_a):
    await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert items[0]["company_name"] == "Acme Corp"


async def test_list_excludes_archived_by_default(client_a):
    # Create and immediately archive an application
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)

    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    ids = [a["id"] for a in r.json()["items"]]
    assert app_id not in ids


async def test_list_archived_returns_archived(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]
    await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)

    r = await client_a.get("/api/v1/applications?archived=true", headers=_BEARER)
    assert r.status_code == 200
    ids = [a["id"] for a in r.json()["items"]]
    assert app_id in ids


async def test_list_filters_by_status(client_a):
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "APPLIED"}, headers=_BEARER
    )
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "OFFER"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?status=APPLIED", headers=_BEARER)
    statuses = [a["status"] for a in r.json()["items"]]
    assert all(s == "APPLIED" for s in statuses)


async def test_list_isolates_between_users(client_a, client_b):
    """User B must not see User A's applications."""
    await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)

    r = await client_b.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    assert r.json()["items"] == []


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


# ── POST /applications/{id}/status ─────────────────────────────────────────────


async def test_status_transition_changes_status(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    assert r.json()["status"] == "APPLIED"


async def test_status_transition_derives_stage(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "INTERVIEW_1"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    assert r.json()["stage"] == "INTERVIEW"


async def test_status_transition_saves_sub_status(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED", "sub_status": "Warte auf Rückmeldung"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    assert r.json()["sub_status"] == "Warte auf Rückmeldung"


async def test_status_transition_updates_last_status_change_at(client_a):
    cr = await client_a.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "status": "SAVED"},
        headers=_BEARER,
    )
    app_id = cr.json()["id"]
    original_ts = cr.json()["last_status_change_at"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    assert r.json()["last_status_change_at"] != original_ts


async def test_status_transition_updates_updated_at(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]
    original_updated = cr.json()["updated_at"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    assert r.status_code == 200
    assert r.json()["updated_at"] != original_updated


async def test_status_transition_requires_auth(db_session):
    app = _make_app(db_session, _USER_A)
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        cr = await c.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
        app_id = cr.json()["id"]
        r = await c.post(
            f"/api/v1/applications/{app_id}/status",
            json={"to_status": "APPLIED"},
        )
    assert r.status_code == 401


async def test_status_transition_other_user_is_404(client_a, client_b):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_b.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED"},
        headers=_BEARER,
    )
    assert r.status_code == 404


async def test_status_transition_invalid_status_returns_422(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "NOT_A_VALID_STATUS"},
        headers=_BEARER,
    )
    assert r.status_code == 422


async def test_status_transition_cannot_set_protected_fields(client_a):
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED", "stage": "OFFER"},
        headers=_BEARER,
    )
    assert r.status_code == 422

    r2 = await client_a.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": "APPLIED", "user_id": "00000000-0000-0000-0000-000000000000"},
        headers=_BEARER,
    )
    assert r2.status_code == 422


# ── GET /applications — B7: envelope, filters, pagination, sort ────────────────


async def test_list_envelope_structure(client_a):
    """GET /applications always returns {items, total, limit, offset}."""
    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    for key in ("items", "total", "limit", "offset"):
        assert key in body, f"Missing envelope key: {key}"
    assert isinstance(body["items"], list)
    assert isinstance(body["total"], int)


async def test_list_comma_separated_status(client_a):
    """Comma-separated status values filter inclusively."""
    for st in ("APPLIED", "OFFER", "REJECTED"):
        await client_a.post(
            "/api/v1/applications", json={**_MINIMAL_APP, "status": st}, headers=_BEARER
        )

    r = await client_a.get("/api/v1/applications?status=APPLIED,OFFER", headers=_BEARER)
    assert r.status_code == 200
    statuses = {a["status"] for a in r.json()["items"]}
    assert statuses <= {"APPLIED", "OFFER"}
    assert "REJECTED" not in statuses


async def test_list_stage_filter(client_a):
    """stage= filter returns only matching stage."""
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "INTERVIEW_1"}, headers=_BEARER
    )
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "APPLIED"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?stage=INTERVIEW", headers=_BEARER)
    assert r.status_code == 200
    items = r.json()["items"]
    assert len(items) >= 1
    assert all(a["stage"] == "INTERVIEW" for a in items)


async def test_list_search_case_insensitive(client_a):
    """search= is case-insensitive across company_name, role_title, location_text, source."""
    await client_a.post(
        "/api/v1/applications",
        json={"company_name": "Notion Labs", "role_title": "Backend Engineer"},
        headers=_BEARER,
    )
    await client_a.post(
        "/api/v1/applications",
        json={"company_name": "Other Corp", "role_title": "Frontend"},
        headers=_BEARER,
    )

    for query in ("notion", "NOTION", "Notion"):
        r = await client_a.get(f"/api/v1/applications?search={query}", headers=_BEARER)
        assert r.status_code == 200
        companies = [a["company_name"] for a in r.json()["items"]]
        assert any("Notion" in c for c in companies), f"search={query!r} missed Notion"
        assert not any("Other" in c for c in companies), f"search={query!r} leaked Other"


async def test_list_search_on_role_title(client_a):
    """search= matches role_title."""
    await client_a.post(
        "/api/v1/applications",
        json={"company_name": "Acme", "role_title": "Staff Machine Learning Engineer"},
        headers=_BEARER,
    )

    r = await client_a.get("/api/v1/applications?search=machine+learning", headers=_BEARER)
    assert r.status_code == 200
    assert len(r.json()["items"]) >= 1


async def test_list_limit_offset_pagination(client_a):
    """limit/offset returns non-overlapping pages."""
    for i in range(4):
        await client_a.post(
            "/api/v1/applications",
            json={"company_name": f"Paginate Co {i}", "role_title": "Dev"},
            headers=_BEARER,
        )

    r1 = await client_a.get("/api/v1/applications?limit=2&offset=0", headers=_BEARER)
    r2 = await client_a.get("/api/v1/applications?limit=2&offset=2", headers=_BEARER)

    assert r1.status_code == 200
    assert r2.status_code == 200
    assert len(r1.json()["items"]) == 2
    assert r1.json()["total"] >= 4

    ids1 = {a["id"] for a in r1.json()["items"]}
    ids2 = {a["id"] for a in r2.json()["items"]}
    assert ids1.isdisjoint(ids2), "Pages overlap — offset is broken"


async def test_list_total_reflects_filter(client_a):
    """total matches the filter, not the full table."""
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "APPLIED"}, headers=_BEARER
    )
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "OFFER"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?status=APPLIED&limit=1", headers=_BEARER)
    body = r.json()
    assert body["total"] == 1
    assert body["limit"] == 1
    assert len(body["items"]) == 1


async def test_list_limit_over_100_returns_422(client_a):
    r = await client_a.get("/api/v1/applications?limit=101", headers=_BEARER)
    assert r.status_code == 422


async def test_list_limit_zero_returns_422(client_a):
    r = await client_a.get("/api/v1/applications?limit=0", headers=_BEARER)
    assert r.status_code == 422


async def test_list_negative_offset_returns_422(client_a):
    r = await client_a.get("/api/v1/applications?offset=-1", headers=_BEARER)
    assert r.status_code == 422


async def test_list_invalid_sort_returns_422(client_a):
    r = await client_a.get("/api/v1/applications?sort=newest_first", headers=_BEARER)
    assert r.status_code == 422


async def test_list_sort_created_at_params_accepted(client_a):
    """created_at sort options are valid and return 200."""
    r_asc = await client_a.get("/api/v1/applications?sort=created_at_asc", headers=_BEARER)
    r_desc = await client_a.get("/api/v1/applications?sort=created_at_desc", headers=_BEARER)
    assert r_asc.status_code == 200
    assert r_desc.status_code == 200


async def test_list_sort_updated_at_desc(client_a):
    """Most recently patched application appears first with updated_at_desc."""
    cr1 = await client_a.post(
        "/api/v1/applications", json={"company_name": "Alpha", "role_title": "Dev"}, headers=_BEARER
    )
    cr2 = await client_a.post(
        "/api/v1/applications", json={"company_name": "Beta", "role_title": "Dev"}, headers=_BEARER
    )
    id1, id2 = cr1.json()["id"], cr2.json()["id"]

    # Touch id1 — its updated_at becomes Python datetime.now(UTC), strictly
    # after the server_default(now()) used for both creates in this transaction.
    await client_a.patch(
        f"/api/v1/applications/{id1}", json={"current_note": "touch"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?sort=updated_at_desc", headers=_BEARER)
    ids_in_order = [a["id"] for a in r.json()["items"] if a["id"] in {id1, id2}]
    assert ids_in_order[0] == id1, "Most recently updated app should come first"


async def test_list_sort_updated_at_asc(client_a):
    """Least recently updated application appears first with updated_at_asc."""
    cr1 = await client_a.post(
        "/api/v1/applications", json={"company_name": "Alpha", "role_title": "Dev"}, headers=_BEARER
    )
    cr2 = await client_a.post(
        "/api/v1/applications", json={"company_name": "Beta", "role_title": "Dev"}, headers=_BEARER
    )
    id1, id2 = cr1.json()["id"], cr2.json()["id"]

    await client_a.patch(
        f"/api/v1/applications/{id1}", json={"current_note": "touch"}, headers=_BEARER
    )

    r = await client_a.get("/api/v1/applications?sort=updated_at_asc", headers=_BEARER)
    ids_in_order = [a["id"] for a in r.json()["items"] if a["id"] in {id1, id2}]
    assert ids_in_order[-1] == id1, "Most recently updated app should come last in asc order"


async def test_list_user_isolation_with_filters(client_a, client_b):
    """Filters must not leak cross-user data."""
    await client_a.post(
        "/api/v1/applications", json={**_MINIMAL_APP, "status": "APPLIED"}, headers=_BEARER
    )

    r = await client_b.get("/api/v1/applications?status=APPLIED", headers=_BEARER)
    assert r.status_code == 200
    assert r.json()["items"] == []
    assert r.json()["total"] == 0


async def test_list_age_fields_on_single_get(client_a):
    """GET /applications/{id} response includes all three age fields."""
    cr = await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)
    app_id = cr.json()["id"]

    r = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    assert "days_in_pipeline" in body
    assert "days_since_applied" in body
    assert "days_in_current_status" in body
    assert isinstance(body["days_in_pipeline"], int)
    assert body["days_since_applied"] is None   # no applied_at on a fresh SAVED app
    assert isinstance(body["days_in_current_status"], int)


async def test_list_age_fields_in_list_response(client_a):
    """Items in the list envelope also include age fields."""
    await client_a.post("/api/v1/applications", json=_MINIMAL_APP, headers=_BEARER)

    r = await client_a.get("/api/v1/applications", headers=_BEARER)
    item = r.json()["items"][0]
    assert "days_in_pipeline" in item
    assert "days_since_applied" in item
    assert "days_in_current_status" in item


async def test_list_age_days_since_applied_non_null_when_applied_at_set(client_a):
    """days_since_applied is an int when applied_at is present."""
    cr = await client_a.post(
        "/api/v1/applications",
        json={**_MINIMAL_APP, "status": "APPLIED", "applied_at": "2024-01-01T00:00:00Z"},
        headers=_BEARER,
    )
    app_id = cr.json()["id"]

    r = await client_a.get(f"/api/v1/applications/{app_id}", headers=_BEARER)
    body = r.json()
    assert isinstance(body["days_since_applied"], int)
    assert body["days_since_applied"] >= 0
