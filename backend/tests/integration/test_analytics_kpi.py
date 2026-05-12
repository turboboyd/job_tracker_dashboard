"""Integration tests for GET /api/v1/analytics/kpi.

Covers:
- 401 when unauthenticated
- Empty account returns zero KPI
- User isolation (current user only sees own data)
- total / active / archived counts
- status_counts grouping
- follow_ups_due
- response_rate / interview_rate / offer_rate
- range=7d / 30d / all filtering
- invalid range returns 422
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

# ── Mock helpers ─────────────────────────────────────────────────────────────


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER_A: DecodedFirebaseToken = {
    "firebase_uid": "analytics-test-uid-a",
    "email": "analytics-usera@example.com",
    "display_name": "Analytics User A",
    "photo_url": None,
}
_USER_B: DecodedFirebaseToken = {
    "firebase_uid": "analytics-test-uid-b",
    "email": "analytics-userb@example.com",
    "display_name": "Analytics User B",
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


# ── Helpers ──────────────────────────────────────────────────────────────────


async def _create_cycle(client: AsyncClient, title: str = "Analytics Cycle") -> str:
    r = await client.post(
        "/api/v1/cycles", json={"title": title, "target_role": "Backend Engineer"}, headers=_BEARER
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _create_app(client: AsyncClient, overrides: dict | None = None) -> str:
    cycle_id = await _create_cycle(client)
    payload = {**_MINIMAL_APP, "cycle_id": cycle_id, **(overrides or {})}
    r = await client.post("/api/v1/applications", json=payload, headers=_BEARER)
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _set_status(client: AsyncClient, app_id: str, status: str) -> None:
    r = await client.post(
        f"/api/v1/applications/{app_id}/status",
        json={"to_status": status},
        headers=_BEARER,
    )
    assert r.status_code == 200, r.text


async def _kpi(client: AsyncClient, **params) -> dict:
    r = await client.get("/api/v1/analytics/kpi", params=params, headers=_BEARER)
    assert r.status_code == 200, r.text
    return r.json()


# ── Auth ─────────────────────────────────────────────────────────────────────


async def test_kpi_unauthenticated_returns_401(client_a):
    r = await client_a.get("/api/v1/analytics/kpi")
    assert r.status_code == 401


# ── Empty account ─────────────────────────────────────────────────────────────


async def test_kpi_empty_account_returns_zeros(client_a):
    kpi = await _kpi(client_a)

    assert kpi["total_applications"] == 0
    assert kpi["active_applications"] == 0
    assert kpi["archived_applications"] == 0
    assert kpi["follow_ups_due"] == 0
    assert kpi["applied_count"] == 0
    assert kpi["interview_count"] == 0
    assert kpi["offer_count"] == 0
    assert kpi["rejected_count"] == 0
    assert kpi["response_rate"] == 0.0
    assert kpi["interview_rate"] == 0.0
    assert kpi["offer_rate"] == 0.0
    assert kpi["status_counts"] == {}


# ── Default range field ────────────────────────────────────────────────────────


async def test_kpi_default_range_is_30d(client_a):
    kpi = await _kpi(client_a)
    assert kpi["range"] == "30d"


# ── User isolation ────────────────────────────────────────────────────────────


async def test_kpi_user_sees_only_own_applications(client_a, client_b):
    await _create_app(client_a)
    await _create_app(client_a)

    kpi_a = await _kpi(client_a)
    kpi_b = await _kpi(client_b)

    assert kpi_a["total_applications"] >= 2
    # User B's own count is unaffected by User A's applications.
    assert kpi_b["total_applications"] < kpi_a["total_applications"]


# ── total / active / archived counts ─────────────────────────────────────────


async def test_kpi_total_active_archived_counts(client_a):
    app_id = await _create_app(client_a)
    # Archive it
    r = await client_a.delete(f"/api/v1/applications/{app_id}", headers=_BEARER)
    assert r.status_code == 204

    kpi = await _kpi(client_a)

    assert kpi["total_applications"] == kpi["active_applications"] + kpi["archived_applications"]
    assert kpi["archived_applications"] >= 1


# ── status_counts ─────────────────────────────────────────────────────────────


async def test_kpi_status_counts_reflect_statuses(client_a):
    await _create_app(client_a)
    app2 = await _create_app(client_a)
    await _set_status(client_a, app2, "APPLIED")

    kpi = await _kpi(client_a)

    assert "SAVED" in kpi["status_counts"]
    assert "APPLIED" in kpi["status_counts"]
    assert kpi["status_counts"]["APPLIED"] >= 1


# ── applied_count ─────────────────────────────────────────────────────────────


async def test_kpi_applied_count_excludes_saved_and_planned(client_a):
    # SAVED apps should not count toward applied_count
    await _create_app(client_a)  # stays SAVED
    app2 = await _create_app(client_a)
    await _set_status(client_a, app2, "APPLIED")

    kpi = await _kpi(client_a)

    # applied_count must be at least 1 (the APPLIED app) but
    # must be < total_applications (because SAVED apps are excluded)
    assert kpi["applied_count"] >= 1
    assert kpi["applied_count"] < kpi["total_applications"]


# ── interview / offer / rejected counts ──────────────────────────────────────


async def test_kpi_interview_count(client_a):
    app_id = await _create_app(client_a)
    await _set_status(client_a, app_id, "INTERVIEW_1")

    kpi = await _kpi(client_a)

    assert kpi["interview_count"] >= 1


async def test_kpi_offer_count(client_a):
    app_id = await _create_app(client_a)
    await _set_status(client_a, app_id, "OFFER")

    kpi = await _kpi(client_a)

    assert kpi["offer_count"] >= 1


async def test_kpi_rejected_count_includes_no_response(client_a):
    app1 = await _create_app(client_a)
    await _set_status(client_a, app1, "REJECTED")
    app2 = await _create_app(client_a)
    await _set_status(client_a, app2, "NO_RESPONSE")

    kpi = await _kpi(client_a)

    assert kpi["rejected_count"] >= 2


# ── rates ─────────────────────────────────────────────────────────────────────


async def test_kpi_response_rate_is_zero_when_no_applied(client_a):
    # All apps are SAVED — no applied_count → rate must be 0.0 (no division by zero)
    await _create_app(client_a)

    kpi = await _kpi(client_a)

    assert kpi["response_rate"] == 0.0


async def test_kpi_rates_are_floats_rounded_to_4_decimals(client_a):
    app1 = await _create_app(client_a)
    await _set_status(client_a, app1, "APPLIED")
    app2 = await _create_app(client_a)
    await _set_status(client_a, app2, "INTERVIEW_1")
    app3 = await _create_app(client_a)
    await _set_status(client_a, app3, "OFFER")

    kpi = await _kpi(client_a)

    # All rates must be floats in [0, 1]
    for key in ("response_rate", "interview_rate", "offer_rate"):
        val = kpi[key]
        assert isinstance(val, float), f"{key} should be float"
        assert 0.0 <= val <= 1.0, f"{key} out of [0,1]: {val}"
        # At most 4 decimal places
        assert round(val, 4) == val, f"{key} has more than 4 decimal places: {val}"


async def test_kpi_offer_rate_computed_correctly(client_a):
    # Create 3 applied apps, 1 reaches OFFER
    apps = [await _create_app(client_a) for _ in range(3)]
    for app_id in apps:
        await _set_status(client_a, app_id, "APPLIED")
    await _set_status(client_a, apps[0], "OFFER")

    kpi = await _kpi(client_a)

    applied = kpi["applied_count"]
    offer = kpi["offer_count"]
    assert applied >= 3
    assert offer >= 1
    expected = round(offer / applied, 4)
    assert kpi["offer_rate"] == expected


# ── Range filtering ───────────────────────────────────────────────────────────


async def test_kpi_range_all_includes_everything(client_a):
    await _create_app(client_a)

    kpi_all = await _kpi(client_a, range="all")
    kpi_30d = await _kpi(client_a, range="30d")

    # Apps created within 30d should also appear in "all"
    assert kpi_all["total_applications"] >= kpi_30d["total_applications"]


async def test_kpi_range_7d_is_subset_of_all(client_a):
    await _create_app(client_a)

    kpi_7d = await _kpi(client_a, range="7d")
    kpi_all = await _kpi(client_a, range="all")

    assert kpi_7d["total_applications"] <= kpi_all["total_applications"]


async def test_kpi_range_param_is_echoed_in_response(client_a):
    for r_param in ("7d", "30d", "90d", "all"):
        kpi = await _kpi(client_a, range=r_param)
        assert kpi["range"] == r_param


# ── Validation ────────────────────────────────────────────────────────────────


async def test_kpi_invalid_range_returns_422(client_a):
    r = await client_a.get(
        "/api/v1/analytics/kpi",
        params={"range": "invalid"},
        headers=_BEARER,
    )
    assert r.status_code == 422
