"""Integration test for the loop-PATCH rescore hook (Stage 6c).

When a loop PATCH changes a score-relevant field (target_role, location,
keywords, excluded_keywords, selected_sources), the persisted scores of that
loop's matches must be recomputed so score-ranked lists never disagree with a
fresh evaluation. An irrelevant PATCH (e.g. title-only) must NOT touch scores —
and rescoring must never bump ``updated_at`` (it is not a content edit).
"""

from __future__ import annotations

from uuid import uuid4

import pytest
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.loop import Loop
from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.modules.loops.schemas import LoopUpdate
from app.modules.loops.service import LoopsService

pytestmark = pytest.mark.asyncio(loop_scope="session")


async def _make_user_loop_matches(db: AsyncSession):
    user = User(firebase_uid=f"rescore-{uuid4()}", email="rescore@example.com")
    db.add(user)
    await db.flush()

    loop = Loop(
        user_id=user.id,
        title="Rescore Loop",
        target_role="Frontend Developer",
        location="Berlin",
        keywords=[],
        excluded_keywords=[],
        selected_sources=["arbeitsagentur"],
        status="active",
    )
    db.add(loop)
    await db.flush()

    # Two matches that will gain a keyword hit once the loop learns "react".
    matches = [
        VacancyMatch(
            user_id=user.id,
            loop_id=str(loop.id),
            source_url=f"https://example.com/jobs/{i}",
            source="arbeitsagentur",
            external_id=f"r-{i}",
            role_title="Frontend Developer",
            company_name="Acme",
            location_text="Berlin",
            vacancy_description="We use React heavily.",
            status="new",
            # No score yet — created directly, not through a scoring path.
        )
        for i in range(2)
    ]
    db.add_all(matches)
    await db.flush()
    return user, loop, matches


async def test_score_relevant_patch_rescores_matches(db_session):
    user, loop, _ = await _make_user_loop_matches(db_session)
    svc = LoopsService(db_session)

    # Baseline: title (25) + location (10) + source (15) = 50, no keyword yet.
    await svc.patch(user, loop.id, LoopUpdate(keywords=["react"]))

    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == str(loop.id))
            )
        )
        .scalars()
        .all()
    )
    assert len(rows) == 2
    for row in rows:
        # 50 + react keyword (10) = 60.
        assert row.score == 60
        assert row.score_version == 1
        assert row.score_details["components"]["keywords"] == 10


async def test_irrelevant_patch_does_not_rescore(db_session):
    user, loop, matches = await _make_user_loop_matches(db_session)
    svc = LoopsService(db_session)

    # Pre-stamp a deliberately wrong score so we can detect any rescore.
    for match in matches:
        match.score = 999
        match.score_version = 1
    await db_session.flush()
    original_updated_at = matches[0].updated_at

    # title is not a score input → no rescore.
    await svc.patch(user, loop.id, LoopUpdate(title="Renamed Loop"))

    rows = (
        (
            await db_session.execute(
                select(VacancyMatch).where(VacancyMatch.loop_id == str(loop.id))
            )
        )
        .scalars()
        .all()
    )
    for row in rows:
        assert row.score == 999  # untouched
        assert row.updated_at == original_updated_at  # not a content edit
