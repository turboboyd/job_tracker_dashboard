"""Integration tests for the cross-loop matches feed (GET /api/v1/matches).

Drives the real SQL path against PostgreSQL: per-loop source scoping, the
all/new/saved tabs, q/source filters, freshness sort, pagination, stable tab
counts, and exclusion of paused/archived loops.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.models.loop import Loop
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.db.session import get_db
from app.main import create_app

pytestmark = pytest.mark.asyncio(loop_scope="session")

_USER: DecodedFirebaseToken = {
    "firebase_uid": "matches-feed-uid",
    "email": "matches-feed@example.com",
    "display_name": "Matches Feed User",
    "photo_url": None,
}
_BEARER = {"Authorization": "Bearer mock"}
_NOW = datetime(2026, 6, 8, 12, 0, tzinfo=UTC)


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


def _make_app(session: AsyncSession):
    app = create_app()

    async def _db():
        yield session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(_USER)
    return app


@pytest_asyncio.fixture
async def client(db_session):
    async with AsyncClient(
        transport=ASGITransport(app=_make_app(db_session)),
        base_url="http://test",
    ) as c:
        yield c


def _match(user_id, loop_id, **over) -> VacancyMatch:
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


@pytest_asyncio.fixture
async def seeded(client, db_session):
    """Create the user, three loops, and a fixed match dataset.

    Returns the user and a dict of loop ids. Dataset (only visible-loop,
    source-allowed rows count toward the feed):

      Loop A (sources: indeed, linkedin, arbeitnow):
        m1 new/unseen indeed UniqueCorp  (posted newest)
        m2 new/seen   indeed
        m3 saved      linkedin
        m4 converted  arbeitnow
      Loop B (restricted to arbeitnow):
        m5 new/unseen arbeitnow          (included)
        m6 new/unseen indeed             (EXCLUDED: source not allowed)
      Loop C (paused, sources: indeed):
        m7 new/unseen indeed             (EXCLUDED: paused loop)
    """
    await client.get("/api/v1/users/me", headers=_BEARER)
    await db_session.commit()
    user = (
        await db_session.execute(
            select(User).where(User.firebase_uid == _USER["firebase_uid"])
        )
    ).scalar_one()

    # Integration tests commit to a shared real database; wipe any rows this
    # user accumulated from a prior test so each run starts from a clean slate.
    await db_session.execute(delete(VacancyMatch).where(VacancyMatch.user_id == user.id))
    await db_session.execute(delete(Loop).where(Loop.user_id == user.id))
    await db_session.commit()

    loop_a = Loop(
        user_id=user.id,
        title="Alpha",
        selected_sources=["indeed", "linkedin", "arbeitnow"],
        status="active",
    )
    loop_b = Loop(
        user_id=user.id,
        title="Bravo",
        selected_sources=["arbeitnow"],
        status="active",
    )
    loop_c = Loop(
        user_id=user.id,
        title="Charlie",
        selected_sources=["indeed"],
        status="paused",
    )
    db_session.add_all([loop_a, loop_b, loop_c])
    await db_session.flush()

    db_session.add_all(
        [
            _match(
                user.id,
                loop_a.id,
                external_id="m1",
                source="indeed",
                company_name="UniqueCorp",
                status="new",
                posted_at=_NOW,
            ),
            _match(
                user.id,
                loop_a.id,
                external_id="m2",
                source="indeed",
                status="new",
                seen_at=_NOW,
                posted_at=_NOW - timedelta(days=1),
            ),
            _match(
                user.id,
                loop_a.id,
                external_id="m3",
                source="linkedin",
                status="saved",
                posted_at=_NOW - timedelta(days=2),
            ),
            _match(
                user.id,
                loop_a.id,
                external_id="m4",
                source="arbeitnow",
                status="converted",
                posted_at=_NOW - timedelta(days=3),
            ),
            _match(
                user.id,
                loop_b.id,
                external_id="m5",
                source="arbeitnow",
                status="new",
                posted_at=_NOW - timedelta(days=4),
            ),
            _match(
                user.id,
                loop_b.id,
                external_id="m6",
                source="indeed",
                status="new",
                posted_at=_NOW - timedelta(days=5),
            ),
            _match(
                user.id,
                loop_c.id,
                external_id="m7",
                source="indeed",
                status="new",
                posted_at=_NOW,
            ),
        ]
    )
    await db_session.commit()
    return {"user": user, "a": loop_a.id, "b": loop_b.id, "c": loop_c.id}


async def test_all_tab_scopes_to_visible_loops_and_allowed_sources(client, seeded):
    r = await client.get("/api/v1/matches", headers=_BEARER)
    assert r.status_code == 200, r.text
    body = r.json()
    # m6 dropped (source not allowed by loop B); m7 dropped (paused loop C).
    assert body["total"] == 5
    assert len(body["items"]) == 5
    assert body["counts"] == {"all": 5, "new": 2, "saved": 2}
    externals = {item["external_id"] for item in body["items"]}
    assert externals == {"m1", "m2", "m3", "m4", "m5"}


async def test_loop_with_no_selected_sources_contributes_nothing(client, seeded, db_session):
    """A still-active loop whose sources were all removed must not surface its
    old matches in the cross-loop feed — yet the rows are NOT deleted.

    Regression test for the stale-matches bug: clearing a loop's
    ``selected_sources`` (the user's way of saying "stop searching this") left an
    empty allow-list that the feed wrongly treated as "any source", so every old
    match stayed visible. The corrected rule: no selected sources -> no matches.
    """
    user = seeded["user"]
    loop_d = Loop(user_id=user.id, title="Delta", selected_sources=[], status="active")
    db_session.add(loop_d)
    await db_session.flush()
    db_session.add_all(
        [
            _match(
                user.id, loop_d.id, external_id="m8", source="indeed",
                status="saved", posted_at=_NOW,
            ),
            _match(
                user.id, loop_d.id, external_id="m9", source="remoteok",
                status="new", posted_at=_NOW,
            ),
        ]
    )
    await db_session.commit()

    r = await client.get("/api/v1/matches", headers=_BEARER)
    body = r.json()
    externals = {item["external_id"] for item in body["items"]}
    # Delta's m8/m9 are absent; the original five remain; counts are unchanged
    # (the saved m8 does NOT inflate the saved tab).
    assert "m8" not in externals and "m9" not in externals
    assert externals == {"m1", "m2", "m3", "m4", "m5"}
    assert body["counts"] == {"all": 5, "new": 2, "saved": 2}

    # The rows still exist in the database — this is a view filter, not a delete.
    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == str(loop_d.id))
            )
        )
        .scalars()
        .all()
    )
    assert {row.external_id for row in rows} == {"m8", "m9"}


async def test_items_carry_loop_name(client, seeded):
    r = await client.get("/api/v1/matches?source=linkedin", headers=_BEARER)
    body = r.json()
    assert len(body["items"]) == 1
    assert body["items"][0]["loop_name"] == "Alpha"


async def test_new_tab_is_unseen_and_not_saved(client, seeded):
    r = await client.get("/api/v1/matches?tab=new", headers=_BEARER)
    body = r.json()
    assert body["total"] == 2
    externals = {item["external_id"] for item in body["items"]}
    assert externals == {"m1", "m5"}  # m2 is seen; m3/m4 are saved/converted
    # Counts stay stable regardless of the active tab.
    assert body["counts"] == {"all": 5, "new": 2, "saved": 2}


async def test_saved_tab_includes_saved_and_converted(client, seeded):
    r = await client.get("/api/v1/matches?tab=saved", headers=_BEARER)
    body = r.json()
    assert body["total"] == 2
    externals = {item["external_id"] for item in body["items"]}
    assert externals == {"m3", "m4"}


async def test_source_filter_respects_per_loop_scoping(client, seeded):
    r = await client.get("/api/v1/matches?source=indeed", headers=_BEARER)
    body = r.json()
    # Only loop A's indeed rows; loop B's m6 stays excluded, loop C's m7 too.
    externals = {item["external_id"] for item in body["items"]}
    assert externals == {"m1", "m2"}


async def test_q_filter_matches_company(client, seeded):
    r = await client.get("/api/v1/matches?q=uniquecorp", headers=_BEARER)
    body = r.json()
    assert body["total"] == 1
    assert body["items"][0]["external_id"] == "m1"


async def test_default_sort_is_freshest_first(client, seeded):
    r = await client.get("/api/v1/matches", headers=_BEARER)
    order = [item["external_id"] for item in r.json()["items"]]
    # posted_at desc: m1 newest → m5 oldest.
    assert order == ["m1", "m2", "m3", "m4", "m5"]


async def test_sort_by_score_orders_best_first_nulls_last(client, seeded, db_session):
    """sort=score → score DESC, then NULL scores last, freshness as tie-break.

    Default sort behavior is unchanged (covered by
    test_default_sort_is_freshest_first); this only exercises the new opt-in
    score ordering.
    """
    # Assign scores so the score order differs from the freshness order
    # (m1 newest … m5 oldest). Leave m2 and m4 unscored (NULL).
    scores = {"m1": 10, "m3": 50, "m5": 90}  # m2, m4 stay NULL
    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(
                    VacancyMatch.user_id == seeded["user"].id
                )
            )
        )
        .scalars()
        .all()
    )
    for row in rows:
        if row.external_id in scores:
            row.score = scores[row.external_id]
    await db_session.commit()

    r = await client.get("/api/v1/matches?sort=score", headers=_BEARER)
    order = [item["external_id"] for item in r.json()["items"]]
    # 90, 50, 10 first; then NULLs m2, m4 ordered by freshness (m2 newer).
    assert order == ["m5", "m3", "m1", "m2", "m4"]


async def test_pagination_limit_and_offset(client, seeded):
    first = await client.get("/api/v1/matches?limit=2&offset=0", headers=_BEARER)
    second = await client.get("/api/v1/matches?limit=2&offset=2", headers=_BEARER)
    assert first.json()["total"] == 5
    assert [i["external_id"] for i in first.json()["items"]] == ["m1", "m2"]
    assert [i["external_id"] for i in second.json()["items"]] == ["m3", "m4"]


async def test_no_loops_returns_empty_feed(db_session):
    """A brand-new user with no loops gets an empty, well-formed feed."""
    other: DecodedFirebaseToken = {
        "firebase_uid": "matches-feed-empty-uid",
        "email": "empty@example.com",
        "display_name": "Empty",
        "photo_url": None,
    }
    app = create_app()

    async def _db():
        yield db_session

    app.dependency_overrides[get_db] = _db
    app.dependency_overrides[get_verifier] = lambda: _MockVerifier(other)
    async with AsyncClient(
        transport=ASGITransport(app=app), base_url="http://test"
    ) as c:
        r = await c.get("/api/v1/matches", headers=_BEARER)
    assert r.status_code == 200
    body = r.json()
    assert body["items"] == []
    assert body["total"] == 0
    assert body["counts"] == {"all": 0, "new": 0, "saved": 0}
