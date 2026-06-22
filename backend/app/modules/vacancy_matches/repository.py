from __future__ import annotations

from datetime import UTC, datetime
from typing import Any
from uuid import UUID

from sqlalchemy import and_, case, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.vacancy_match import VacancyMatch


def _escape_like(value: str) -> str:
    """Escape LIKE/ILIKE wildcards so user input is matched literally."""
    return value.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_")


def _freshness_order_by() -> list[Any]:
    """Shared server-side freshness ordering for every match listing.

    Newest first, with deterministic fallbacks so ordering is stable and the
    global feed and the per-loop feed agree on what "fresh" means:

      1. ``posted_at``  DESC NULLS LAST  — source posting time when known; rows
         without a known posting time sort after dated ones.
      2. ``updated_at`` DESC            — last persisted change (fallback when
         ``posted_at`` is null or ties).
      3. ``created_at`` DESC            — first time we saw the row.
      4. ``id``         ASC             — final stable tiebreak for pagination.
    """
    return [
        VacancyMatch.posted_at.desc().nulls_last(),
        VacancyMatch.updated_at.desc(),
        VacancyMatch.created_at.desc(),
        VacancyMatch.id.asc(),
    ]


def _score_order_by() -> list[Any]:
    """Score-ranked ordering: best persisted score first, unscored rows last,
    freshness chain as the deterministic tie-break."""
    return [
        VacancyMatch.score.desc().nulls_last(),
        *_freshness_order_by(),
    ]


class VacancyMatchesRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, match: VacancyMatch) -> VacancyMatch:
        self._db.add(match)
        await self._db.flush()
        await self._db.refresh(match)
        return match

    async def get_owned_in_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatch | None:
        result = await self._db.execute(
            select(VacancyMatch).where(
                VacancyMatch.id == match_id,
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        status: str | None = None,
        sort: str = "freshness",
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[VacancyMatch], int]:
        conditions = [VacancyMatch.user_id == user_id, VacancyMatch.loop_id == loop_id]
        if status:
            conditions.append(VacancyMatch.status == status)

        order_by = (
            _score_order_by() if sort == "score" else _freshness_order_by()
        )

        count_query = select(func.count()).select_from(VacancyMatch).where(*conditions)
        total = (await self._db.execute(count_query)).scalar_one()
        result = await self._db.execute(
            select(VacancyMatch)
            .where(*conditions)
            .order_by(*order_by)
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def list_feed(
        self,
        *,
        user_id: UUID,
        loop_source_filters: list[tuple[str, list[str]]],
        loop_rank: dict[str, int],
        tab: str,
        q: str | None,
        source: str | None,
        sort: str,
        limit: int,
        offset: int,
    ) -> tuple[list[VacancyMatch], dict[str, int]]:
        """Cross-loop paginated feed over persisted matches.

        ``loop_source_filters`` is a list of ``(loop_id, allowed_sources)`` for
        the user's visible loops. A loop contributes a match only when the
        match's source is in that loop's current allow-list. An **empty**
        ``allowed_sources`` means the loop has no selected sources (the user
        cleared them), so it searches nothing and contributes **no** matches —
        the same rule the scheduler uses when it skips such loops. Rows are never
        deleted here; this is purely a view filter. Counts ({all,new,saved}) are
        computed once under the shared q/source/loop scope so tab badges stay
        stable.
        """
        empty_counts = {"all": 0, "new": 0, "saved": 0}
        if not loop_source_filters:
            return [], empty_counts

        loop_clauses = []
        for loop_id_str, allowed in loop_source_filters:
            # No selected sources → the loop searches nothing → no matches.
            if not allowed:
                continue
            loop_clauses.append(
                and_(
                    VacancyMatch.loop_id == loop_id_str,
                    func.lower(VacancyMatch.source).in_(allowed),
                )
            )

        if not loop_clauses:
            return [], empty_counts

        base_conditions = [VacancyMatch.user_id == user_id, or_(*loop_clauses)]

        if source:
            base_conditions.append(func.lower(VacancyMatch.source) == source)

        if q:
            like = f"%{_escape_like(q)}%"
            base_conditions.append(
                or_(
                    VacancyMatch.company_name.ilike(like, escape="\\"),
                    VacancyMatch.role_title.ilike(like, escape="\\"),
                    VacancyMatch.location_text.ilike(like, escape="\\"),
                )
            )

        new_filter = and_(
            VacancyMatch.status == "new", VacancyMatch.seen_at.is_(None)
        )
        saved_filter = VacancyMatch.status.in_(["saved", "converted"])

        counts_row = (
            await self._db.execute(
                select(
                    func.count().label("all"),
                    func.count().filter(new_filter).label("new"),
                    func.count().filter(saved_filter).label("saved"),
                ).where(*base_conditions)
            )
        ).one()
        counts = {
            "all": counts_row.all,
            "new": counts_row.new,
            "saved": counts_row.saved,
        }

        conditions = list(base_conditions)
        if tab == "new":
            conditions.append(new_filter)
        elif tab == "saved":
            conditions.append(saved_filter)

        freshness = _freshness_order_by()
        if sort == "company":
            order_by = [
                func.lower(VacancyMatch.company_name).asc().nulls_last(),
                *freshness,
            ]
        elif sort == "score":
            order_by = _score_order_by()
        elif sort == "loop" and loop_rank:
            whens = [
                (VacancyMatch.loop_id == lid, rank)
                for lid, rank in loop_rank.items()
            ]
            order_by = [
                case(*whens, else_=len(loop_rank)).asc(),
                *freshness,
            ]
        else:  # "posted" (default) and the loop-sort fallback
            order_by = freshness

        result = await self._db.execute(
            select(VacancyMatch)
            .where(*conditions)
            .order_by(*order_by)
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), counts

    async def get_by_source_external_id(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source: str,
        external_id: str,
    ) -> VacancyMatch | None:
        result = await self._db.execute(
            select(VacancyMatch).where(
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
                VacancyMatch.source == source,
                VacancyMatch.external_id == external_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_source(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source: str,
    ) -> list[VacancyMatch]:
        result = await self._db.execute(
            select(VacancyMatch)
            .where(
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
                VacancyMatch.source == source,
            )
            .order_by(VacancyMatch.updated_at.desc(), VacancyMatch.id.asc())
        )
        return list(result.scalars().all())

    async def patch(self, match: VacancyMatch, updates: dict) -> VacancyMatch:
        for field, value in updates.items():
            setattr(match, field, value)
        match.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(match)
        return match

    async def mark_seen(self, match: VacancyMatch) -> VacancyMatch:
        """Stamp ``seen_at`` once (idempotent: keeps the first view time).

        Does not bump ``updated_at`` so marking a match seen never reshuffles
        the freshness sort or looks like a content edit.
        """
        if match.seen_at is None:
            match.seen_at = datetime.now(UTC)
            await self._db.flush()
            await self._db.refresh(match)
        return match
