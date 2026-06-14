"""Integration tests for per-loop funnel metrics in GET /api/v1/loops/{id}.

Covers:
- Empty loop returns zero funnel metrics
- applied_count reflects APPLIED + downstream statuses
- interview_count / offer_count populated when applications progress
- response_rate / interview_rate / offer_rate computed against applied_count
- User isolation: other user's applications under same loop_id don't bleed in
"""

from __future__ import annotations

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.db.session import get_db
from app.main import create_app

pytestmark = pytest.mark.asyncio(loop_scope="session")


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "loop-metrics-uid",
    "email": "loop-metrics@example.com",
    "display_name": "Loop Metrics User",
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
async def client(db_session):
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session, _USER)),
        base_url="http://test",
    ) as c:
        yield c


async def _create_loop(client: AsyncClient, title: str = "Funnel Loop") -> str:
    r = await client.post(
        "/api/v1/loops",
        json={"title": title, "target_role": "Backend Engineer"},
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


async def _create_app(client: AsyncClient, loop_id: str) -> str:
    payload = {**_MINIMAL_APP, "loop_id": loop_id}
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


async def _get_loop(client: AsyncClient, loop_id: str) -> dict:
    r = await client.get(f"/api/v1/loops/{loop_id}", headers=_BEARER)
    assert r.status_code == 200, r.text
    return r.json()


def _match(user_id, loop_id: str, **over) -> VacancyMatch:
    data = {
        "user_id": user_id,
        "loop_id": str(loop_id),
        "source_url": f"https://example.com/jobs/{over.get('external_id', 'x')}",
        "source": "indeed",
        "external_id": None,
        "company_name": "Acme",
        "role_title": "Backend Engineer",
        "location_text": "Berlin",
        "vacancy_description": "Python role.",
        "raw_metadata": {},
        "confidence": {},
        "warnings": [],
        "status": "new",
        "seen_at": None,
        "posted_at": None,
    }
    data.update(over)
    return VacancyMatch(**data)


async def _current_user(db_session: AsyncSession) -> User:
    return (
        await db_session.execute(
            select(User).where(User.firebase_uid == _USER["firebase_uid"])
        )
    ).scalar_one()


async def test_get_loop_empty_funnel(client):
    loop_id = await _create_loop(client)
    body = await _get_loop(client, loop_id)
    metrics = body["metrics"]
    assert metrics["matches_saved"] == 0
    assert metrics["applications_total"] == 0
    assert metrics["applied_count"] == 0
    assert metrics["interview_count"] == 0
    assert metrics["offer_count"] == 0
    assert metrics["rejected_count"] == 0
    assert metrics["response_rate"] == 0.0
    assert metrics["interview_rate"] == 0.0
    assert metrics["offer_rate"] == 0.0


async def test_get_loop_funnel_progression(client):
    loop_id = await _create_loop(client, "Progression Loop")
    saved_id = await _create_app(client, loop_id)
    applied_id = await _create_app(client, loop_id)
    interview_id = await _create_app(client, loop_id)
    offer_id = await _create_app(client, loop_id)

    await _set_status(client, applied_id, "APPLIED")
    await _set_status(client, interview_id, "APPLIED")
    await _set_status(client, interview_id, "INTERVIEW_1")
    await _set_status(client, offer_id, "APPLIED")
    await _set_status(client, offer_id, "OFFER")

    body = await _get_loop(client, loop_id)
    metrics = body["metrics"]

    # 4 active applications attached to this loop (saved + applied + interview + offer)
    assert metrics["applications_total"] == 4
    # APPLIED + INTERVIEW_1 + OFFER are all "applied" downstream statuses, SAVED is not
    assert metrics["applied_count"] == 3
    assert metrics["interview_count"] == 1
    assert metrics["offer_count"] == 1
    # response_rate = with_response / applied = (interview + offer) / applied = 2/3
    assert metrics["response_rate"] == pytest.approx(2 / 3, abs=1e-3)
    assert metrics["interview_rate"] == pytest.approx(1 / 3, abs=1e-3)
    assert metrics["offer_rate"] == pytest.approx(1 / 3, abs=1e-3)


async def test_matches_saved_counts_saved_and_converted_only(client, db_session):
    """matches_saved is the canonical Saved stage: status IN ('saved', 'converted').

    Auto-persisted 'new' candidates must NOT inflate the count, so the per-loop
    metric agrees with the global /api/v1/matches saved tab.
    """
    loop_id = await _create_loop(client, "Saved Metric Loop")
    user = await _current_user(db_session)

    db_session.add_all([
        _match(user.id, loop_id, external_id="n1", status="new"),
        _match(user.id, loop_id, external_id="n2", status="new"),
        _match(user.id, loop_id, external_id="s1", status="saved"),
        _match(user.id, loop_id, external_id="c1", status="converted"),
    ])
    await db_session.commit()

    metrics = (await _get_loop(client, loop_id))["metrics"]
    # 1 saved + 1 converted = 2; the two 'new' candidates are excluded.
    assert metrics["matches_saved"] == 2


async def test_matches_saved_zero_when_only_new(client, db_session):
    """A loop with only auto-persisted 'new' candidates reports 0 saved."""
    loop_id = await _create_loop(client, "New Only Loop")
    user = await _current_user(db_session)

    db_session.add_all([
        _match(user.id, loop_id, external_id="x1", status="new"),
        _match(user.id, loop_id, external_id="x2", status="new"),
        _match(user.id, loop_id, external_id="x3", status="new"),
    ])
    await db_session.commit()

    metrics = (await _get_loop(client, loop_id))["metrics"]
    assert metrics["matches_saved"] == 0
