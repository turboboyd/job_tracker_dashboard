"""Backend-side freshness ordering for match listings.

Proves the shared ORDER BY used by BOTH the global feed (``list_feed``) and the
per-loop feed (``list_for_loop``):

    1. posted_at  DESC NULLS LAST
    2. updated_at DESC
    3. created_at DESC
    4. id         ASC

These call the repository directly with flush-only (no commit) seeding so each
test has full control over posted_at / updated_at / created_at, and the rows
roll back with the session — no cross-test cleanup needed.
"""

from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.loop import Loop
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_matches.repository import VacancyMatchesRepository

pytestmark = pytest.mark.asyncio(loop_scope="session")

_NOW = datetime(2026, 6, 8, 12, 0, tzinfo=UTC)


@pytest_asyncio.fixture
async def ctx(db_session: AsyncSession):
    user = User(firebase_uid="freshness-sort-uid", email="freshness@example.com")
    db_session.add(user)
    await db_session.flush()
    loop = Loop(user_id=user.id, title="Fresh", selected_sources=["indeed"], status="active")
    db_session.add(loop)
    await db_session.flush()
    return {"session": db_session, "user": user, "loop": loop}


def _match(
    ctx: dict,
    *,
    external_id: str,
    posted_at: datetime | None,
    updated_at: datetime,
    created_at: datetime,
    status: str = "new",
) -> VacancyMatch:
    return VacancyMatch(
        user_id=ctx["user"].id,
        loop_id=str(ctx["loop"].id),
        source_url=f"https://example.com/jobs/{external_id}",
        source="indeed",
        external_id=external_id,
        company_name="Acme",
        role_title="Backend Engineer",
        location_text="Berlin",
        vacancy_description="Python role.",
        raw_metadata={},
        confidence={},
        warnings=[],
        status=status,
        seen_at=None,
        posted_at=posted_at,
        created_at=created_at,
        updated_at=updated_at,
    )


async def _seed(ctx: dict, matches: list[VacancyMatch]) -> None:
    ctx["session"].add_all(matches)
    await ctx["session"].flush()


def _repo(ctx: dict) -> VacancyMatchesRepository:
    return VacancyMatchesRepository(ctx["session"])


async def _loop_order(ctx: dict) -> list[str]:
    items, _ = await _repo(ctx).list_for_loop(
        user_id=ctx["user"].id, loop_id=str(ctx["loop"].id), limit=50, offset=0
    )
    return [m.external_id or "" for m in items]


async def _feed_order(ctx: dict) -> list[str]:
    items, _ = await _repo(ctx).list_feed(
        user_id=ctx["user"].id,
        loop_source_filters=[(str(ctx["loop"].id), ["indeed"])],
        loop_rank={str(ctx["loop"].id): 0},
        tab="all",
        q=None,
        source=None,
        sort="posted",
        limit=50,
        offset=0,
    )
    return [m.external_id or "" for m in items]


async def test_posted_at_desc_recent_first(ctx):
    """Rule 1: a vacancy posted 2h ago outranks 2d ago, which outranks 1 month."""
    await _seed(ctx, [
        _match(ctx, external_id="p_1mo", posted_at=_NOW - timedelta(days=30),
               updated_at=_NOW, created_at=_NOW),
        _match(ctx, external_id="p_2h", posted_at=_NOW - timedelta(hours=2),
               updated_at=_NOW, created_at=_NOW),
        _match(ctx, external_id="p_2d", posted_at=_NOW - timedelta(days=2),
               updated_at=_NOW, created_at=_NOW),
    ])
    expected = ["p_2h", "p_2d", "p_1mo"]
    assert await _loop_order(ctx) == expected
    assert await _feed_order(ctx) == expected


async def test_null_posted_falls_back_to_updated_at_and_nulls_last(ctx):
    """Rule 2 + NULLS LAST: dated rows precede null-posted rows; null-posted rows
    order by updated_at DESC."""
    await _seed(ctx, [
        # Dated, even if posted long ago, sorts ahead of every null-posted row.
        _match(ctx, external_id="dated_old", posted_at=_NOW - timedelta(days=100),
               updated_at=_NOW - timedelta(days=100), created_at=_NOW - timedelta(days=100)),
        _match(ctx, external_id="null_updated_old", posted_at=None,
               updated_at=_NOW - timedelta(days=5), created_at=_NOW),
        _match(ctx, external_id="null_updated_new", posted_at=None,
               updated_at=_NOW, created_at=_NOW),
    ])
    expected = ["dated_old", "null_updated_new", "null_updated_old"]
    assert await _loop_order(ctx) == expected
    assert await _feed_order(ctx) == expected


async def test_created_at_breaks_tie_when_posted_null_and_updated_equal(ctx):
    """Rule 3: created_at is the third-tier tiebreak.

    The schema makes updated_at NOT NULL (server_default now()), so the literal
    "posted_at and updated_at both null" case cannot be inserted. We prove the
    equivalent: when posted_at is null on both rows and updated_at ties,
    created_at DESC decides the order.
    """
    tie = _NOW - timedelta(days=1)
    await _seed(ctx, [
        _match(ctx, external_id="created_old", posted_at=None, updated_at=tie,
               created_at=_NOW - timedelta(days=10)),
        _match(ctx, external_id="created_new", posted_at=None, updated_at=tie,
               created_at=_NOW),
    ])
    expected = ["created_new", "created_old"]
    assert await _loop_order(ctx) == expected
    assert await _feed_order(ctx) == expected


async def test_global_and_per_loop_have_consistent_order(ctx):
    """Rule 5: the global feed and the per-loop feed agree on freshness order."""
    await _seed(ctx, [
        _match(ctx, external_id="a", posted_at=_NOW - timedelta(hours=1),
               updated_at=_NOW, created_at=_NOW),
        _match(ctx, external_id="b", posted_at=None,
               updated_at=_NOW, created_at=_NOW),
        _match(ctx, external_id="c", posted_at=_NOW - timedelta(days=3),
               updated_at=_NOW, created_at=_NOW),
        _match(ctx, external_id="d", posted_at=None,
               updated_at=_NOW - timedelta(days=2), created_at=_NOW),
    ])
    feed = await _feed_order(ctx)
    loop = await _loop_order(ctx)
    # Same dataset -> identical ordering on both surfaces.
    assert feed == loop
    # Dated rows first (recent -> old), then null-posted rows by updated_at desc.
    assert feed == ["a", "c", "b", "d"]
