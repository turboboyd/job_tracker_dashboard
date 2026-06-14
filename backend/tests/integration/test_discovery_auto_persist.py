"""Integration test for auto-persisting discovery results as vacancy matches.

Exercises the *real* persistence path of ``DiscoveryRunsService.run`` against
PostgreSQL: a non-dry (auto-discovery) run must write the freshly-found previews
into ``vacancy_matches`` with status ``new`` so they surface in the user's
Matches list, and a second run must NOT create duplicates (cross-run dedupe via
``_filter_already_handled``).

Unlike the unit tests in ``test_discovery_runs_router.py`` (which bind no DB
session, so persistence is skipped), this drives the real SQL round-trips, only
stubbing the adapter so no external job board is contacted.
"""

from __future__ import annotations

from uuid import UUID

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
from app.modules.discovery_adapters.registry import DiscoveryAdapterRegistry
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterResult,
)
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.loops.service import LoopsService

pytestmark = pytest.mark.asyncio(loop_scope="session")

SOURCE_ID = "arbeitsagentur"


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "auto-persist-uid",
    "email": "auto-persist@example.com",
    "display_name": "Auto Persist User",
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
            "title": "Auto Persist Loop",
            "target_role": "Backend Engineer",
            "selected_sources": [SOURCE_ID],
            "auto_discovery_enabled": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _items(n: int = 2) -> list[DiscoveryAdapterItem]:
    return [
        DiscoveryAdapterItem(
            external_id=f"persist-{i}",
            source_url=f"https://example.com/jobs/{i}",
            title=f"Backend Engineer {i}",
            company="Acme",
            location="Berlin",
            snippet="Python role.",
            raw_metadata={"source": "test"},
            confidence={"source_quality": 0.9},
        )
        for i in range(n)
    ]


class _FakeAdapter:
    """Adapter stub that supports the real source id and counts discover() calls."""

    def __init__(self) -> None:
        self.calls = 0

    def supports_source(self, source_id: str) -> bool:
        return source_id == SOURCE_ID

    async def discover(self, *, loop, source, options) -> DiscoveryAdapterResult:
        self.calls += 1
        return DiscoveryAdapterResult(
            source_id=SOURCE_ID,
            status="completed",
            items=_items(2),
        )


def _make_service(db_session, adapter: _FakeAdapter) -> DiscoveryRunsService:
    return DiscoveryRunsService(
        loops=LoopsService(db_session),
        adapter_registry=DiscoveryAdapterRegistry([adapter]),
        db=db_session,
    )


async def test_non_dry_run_persists_new_matches_without_duplicating(
    client, db_session
):
    loop_id = await _create_loop(client)
    await db_session.commit()
    loop_uuid = UUID(loop_id)

    user = (
        await db_session.execute(
            select(User).where(User.firebase_uid == _USER["firebase_uid"])
        )
    ).scalar_one()

    # ── Run 1: cold cache + non-dry → live fetch, previews persisted as "new" ──
    adapter = _FakeAdapter()
    first = await _make_service(db_session, adapter).run(
        user,
        DiscoveryRunRequest(
            loop_id=loop_id, source_ids=[SOURCE_ID], dry_run=False
        ),
    )
    assert adapter.calls == 1  # cache miss → fetched once
    assert first.items[0].status == "would_run"
    assert first.items[0].reason == "automatic_match_persistence"
    assert first.matches_created == 2

    await db_session.commit()
    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == str(loop_uuid))
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 2
    assert {r.status for r in rows} == {"new"}
    assert {r.source for r in rows} == {SOURCE_ID}
    assert {r.external_id for r in rows} == {"persist-0", "persist-1"}

    # Stage 6c: every auto-persisted match is scored at write time by the
    # scoring core. Title "Backend Engineer {i}" fully overlaps the loop's
    # target_role (25) and the source is selected (15) → 40.
    for row in rows:
        assert row.score == 40
        assert row.score_version == 1
        assert row.score_details is not None
        assert row.score_details["components"]["title"] == 25
        assert row.score_details["components"]["source"] == 15

    # ── Run 2: same source → already-handled filter drops them, no duplicates ──
    second = await _make_service(db_session, adapter).run(
        user,
        DiscoveryRunRequest(
            loop_id=loop_id, source_ids=[SOURCE_ID], dry_run=False
        ),
    )
    assert second.matches_created == 0  # everything already persisted

    await db_session.commit()
    count = len(
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == str(loop_uuid))
            )
        )
        .scalars()
        .all()
    )
    assert count == 2  # still exactly two — no duplicate rows


async def test_dry_run_writes_no_vacancy_matches(client, db_session):
    """Explicit guard for the preview/persist boundary: a dry-run (preview)
    discovery pass must NEVER write vacancy_matches rows — «Предварительный
    поиск — не сохраняется автоматически» is a hard product contract."""
    loop_id = await _create_loop(client)
    await db_session.commit()

    user = (
        await db_session.execute(
            select(User).where(User.firebase_uid == _USER["firebase_uid"])
        )
    ).scalar_one()

    adapter = _FakeAdapter()
    response = await _make_service(db_session, adapter).run(
        user,
        DiscoveryRunRequest(loop_id=loop_id, source_ids=[SOURCE_ID], dry_run=True),
    )
    assert response.dry_run is True
    assert response.matches_created == 0
    assert response.matches_previewed > 0  # previews were produced …

    await db_session.commit()
    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == loop_id)
            )
        )
        .scalars()
        .all()
    )
    assert rows == []  # … but nothing was persisted
