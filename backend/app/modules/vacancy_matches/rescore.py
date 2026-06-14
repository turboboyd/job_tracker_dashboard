"""Batch rescoring of a loop's persisted matches.

Standalone module (imports only the model + scoring core, no services) so the
loops module can call it on PATCH without creating an import cycle with
``vacancy_matches.service`` (which itself imports ``loops.service``).

Invoked when a loop PATCH changes a score-relevant field — the persisted scores
would otherwise go stale and visibly disagree with fresh evaluations. Kept
deliberately safe:
- synchronous, capped at ``RESCORE_CAP`` matches (newest first);
- does NOT bump ``updated_at`` — rescoring is not a content edit and must never
  reshuffle the freshness sort (same contract as ``mark_seen``).
"""

from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_matches.scoring import (
    apply_score,
    score_input_from_match,
    score_match,
)

RESCORE_CAP = 500

# Loop fields that feed the scoring formula. A PATCH touching none of these
# (e.g. a title-only rename) must not trigger a rescore.
SCORE_RELEVANT_LOOP_FIELDS = frozenset(
    {
        "target_role",
        "location",
        "keywords",
        "excluded_keywords",
        "selected_sources",
    }
)


def is_score_relevant_update(updated_fields: set[str]) -> bool:
    return bool(updated_fields & SCORE_RELEVANT_LOOP_FIELDS)


async def rescore_loop_matches(db: AsyncSession, loop: Loop) -> int:
    """Recompute and stamp scores for the loop's matches (capped). Returns the
    number of rescored rows. Caller owns the transaction commit."""
    result = await db.execute(
        select(VacancyMatch)
        .where(
            VacancyMatch.user_id == loop.user_id,
            VacancyMatch.loop_id == str(loop.id),
        )
        .order_by(VacancyMatch.created_at.desc(), VacancyMatch.id.asc())
        .limit(RESCORE_CAP)
    )
    matches = list(result.scalars().all())
    for match in matches:
        apply_score(match, score_match(loop, score_input_from_match(match)))
    if matches:
        await db.flush()
    return len(matches)
