"""Integration test: the already-handled filter is scoped *per source*.

``DiscoveryRunsService._load_handled_keys_by_source`` loads every saved/ignored
key for a loop in two queries and groups them by source (replacing the old
per-source N+1 query). This test guards the grouping: a vacancy saved under one
source must NOT suppress a same-``external_id`` vacancy coming from a *different*
source. If grouping regressed to one merged bucket, the second source's item
would be wrongly filtered out.
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.firebase import DecodedFirebaseToken, get_verifier
from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
from app.db.session import get_db
from app.main import create_app
from app.modules.discovery_adapters.schemas import DiscoveryAdapterItem

pytestmark = pytest.mark.asyncio(loop_scope="session")

SOURCE_A = "arbeitsagentur"
SOURCE_B = "remotive"
SHARED_EXTERNAL_ID = "shared-job"
URL_A = "https://www.arbeitsagentur.de/jobsuche/jobdetail/shared-job"
URL_B = "https://remotive.com/remote-jobs/shared-job"


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "handled-grouping-uid",
    "email": "handled-grouping@example.com",
    "display_name": "Handled Grouping User",
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
            "title": "Handled Grouping Loop",
            "target_role": "Frontend Developer",
            "selected_sources": [SOURCE_A, SOURCE_B],
            "auto_discovery_enabled": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 201, r.text
    return r.json()["id"]


def _item(external_id: str, source_url: str, title: str) -> dict:
    return DiscoveryAdapterItem(
        external_id=external_id,
        source_url=source_url,
        title=title,
        company="Example GmbH",
        location="Berlin",
        snippet="A role.",
        posted_at="2026-05-01",
        raw_metadata={"refnr": external_id},
        confidence={"source_quality": 0.7},
    ).model_dump()


def _seed_cache(loop_id: str, source_id: str, source_url: str) -> DiscoveryPreviewCache:
    now = datetime.now(timezone.utc)
    return DiscoveryPreviewCache(
        loop_id=loop_id,
        source_id=source_id,
        search_scope="normal",
        page=1,
        items_json=[_item(SHARED_EXTERNAL_ID, source_url, "Frontend Developer")],
        warnings_json=[],
        has_more=False,
        fetched_at=now,
        expires_at=now + timedelta(hours=4),
        created_at=now,
        updated_at=now,
    )


async def _run_preview(client: AsyncClient, loop_id: str) -> dict:
    r = await client.post(
        "/api/v1/discovery-runs",
        json={
            "loop_id": loop_id,
            "dry_run": True,
            "source_ids": [SOURCE_A, SOURCE_B],
            "page": 1,
            "page_size": 20,
            "cache_only": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 200, r.text
    return r.json()


def _item_for_source(body: dict, source_id: str) -> dict:
    for item in body["items"]:
        if item["source_id"] == source_id:
            return item
    raise AssertionError(f"no run item for source {source_id!r}: {body['items']}")


async def test_saved_match_only_filters_its_own_source(client, db_session):
    loop_id = await _create_loop(client)
    db_session.add(_seed_cache(loop_id, SOURCE_A, URL_A))
    db_session.add(_seed_cache(loop_id, SOURCE_B, URL_B))
    await db_session.commit()

    # Save the shared vacancy under SOURCE_A only.
    save = await client.post(
        f"/api/v1/loops/{loop_id}/matches/from-preview",
        json={
            "source_id": SOURCE_A,
            "external_id": SHARED_EXTERNAL_ID,
            "source_url": URL_A,
            "title": "Frontend Developer",
            "company": "Example GmbH",
            "location": "Berlin",
        },
        headers=_BEARER,
    )
    assert save.status_code == 201, save.text
    await db_session.commit()

    body = await _run_preview(client, loop_id)

    # SOURCE_A drops the saved item...
    item_a = _item_for_source(body, SOURCE_A)
    assert item_a["items_previewed"] == 0
    assert item_a["preview_items"] == []

    # ...but SOURCE_B keeps its same-external_id item (different source bucket).
    item_b = _item_for_source(body, SOURCE_B)
    assert item_b["items_previewed"] == 1
    assert {p["external_id"] for p in item_b["preview_items"]} == {SHARED_EXTERNAL_ID}
