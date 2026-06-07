"""Integration test: the discovery preview feed drops vacancies whose title /
company / snippet match one of the loop's ``excluded_keywords`` (minus-words).

Before this fix ``excluded_keywords`` were stored on the loop but never applied,
so a loop that explicitly excluded e.g. "senior" still got senior postings.
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

SOURCE_ID = "arbeitsagentur"
JOB_1_URL = "https://www.arbeitsagentur.de/jobsuche/jobdetail/job-1"
JOB_2_URL = "https://www.arbeitsagentur.de/jobsuche/jobdetail/job-2"


class _MockVerifier:
    def __init__(self, data: DecodedFirebaseToken) -> None:
        self._data = data

    def verify_id_token(self, token: str) -> DecodedFirebaseToken:
        return self._data


_USER: DecodedFirebaseToken = {
    "firebase_uid": "excluded-kw-uid",
    "email": "excluded-kw@example.com",
    "display_name": "Excluded KW User",
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


async def _create_loop(client: AsyncClient, excluded_keywords: list[str]) -> str:
    r = await client.post(
        "/api/v1/loops",
        json={
            "title": "Excluded KW Loop",
            "target_role": "Frontend Developer",
            "selected_sources": [SOURCE_ID],
            "excluded_keywords": excluded_keywords,
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


def _seed_cache(loop_id: str) -> DiscoveryPreviewCache:
    now = datetime.now(timezone.utc)
    return DiscoveryPreviewCache(
        loop_id=loop_id,
        source_id=SOURCE_ID,
        search_scope="normal",
        page=1,
        items_json=[
            _item("job-1", JOB_1_URL, "Senior Frontend Developer"),
            _item("job-2", JOB_2_URL, "Frontend React Developer"),
        ],
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
            "source_ids": [SOURCE_ID],
            "page": 1,
            "page_size": 20,
            "cache_only": True,
        },
        headers=_BEARER,
    )
    assert r.status_code == 200, r.text
    return r.json()


async def test_excluded_keyword_is_filtered_from_preview(client, db_session):
    loop_id = await _create_loop(client, excluded_keywords=["senior"])
    db_session.add(_seed_cache(loop_id))
    await db_session.commit()

    body = await _run_preview(client, loop_id)
    item = body["items"][0]
    # "Senior Frontend Developer" is dropped; the plain role remains.
    assert item["items_previewed"] == 1
    remaining = {p["external_id"] for p in item["preview_items"]}
    assert remaining == {"job-2"}


async def test_no_excluded_keywords_keeps_all_items(client, db_session):
    loop_id = await _create_loop(client, excluded_keywords=[])
    db_session.add(_seed_cache(loop_id))
    await db_session.commit()

    body = await _run_preview(client, loop_id)
    item = body["items"][0]
    assert item["items_previewed"] == 2
    remaining = {p["external_id"] for p in item["preview_items"]}
    assert remaining == {"job-1", "job-2"}
