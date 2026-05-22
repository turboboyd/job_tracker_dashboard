from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch


class LoopsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, loop: Loop) -> Loop:
        self._db.add(loop)
        await self._db.flush()
        await self._db.refresh(loop)
        return loop

    async def get_by_id(self, loop_id: UUID) -> Loop | None:
        result = await self._db.execute(select(Loop).where(Loop.id == loop_id))
        return result.scalar_one_or_none()

    async def get_owned(self, user_id: UUID, loop_id: UUID) -> Loop | None:
        result = await self._db.execute(
            select(Loop).where(Loop.id == loop_id, Loop.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        include_archived: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Loop], int]:
        conditions = [Loop.user_id == user_id]
        if not include_archived:
            conditions.append(Loop.status != "archived")

        count_query = select(func.count()).select_from(Loop).where(*conditions)
        total = (await self._db.execute(count_query)).scalar_one()
        result = await self._db.execute(
            select(Loop)
            .where(*conditions)
            .order_by(Loop.updated_at.desc(), Loop.id.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def patch(self, loop: Loop, updates: dict) -> Loop:
        for field, value in updates.items():
            setattr(loop, field, value)
        loop.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(loop)
        return loop

    async def get_metrics_by_loop_ids(
        self, loop_ids: list[UUID]
    ) -> dict[str, dict[str, int]]:
        if not loop_ids:
            return {}

        str_ids = [str(lid) for lid in loop_ids]

        match_query = (
            select(VacancyMatch.loop_id, func.count().label("cnt"))
            .where(
                VacancyMatch.loop_id.in_(str_ids),
                VacancyMatch.status.in_(["new", "saved"]),
            )
            .group_by(VacancyMatch.loop_id)
        )
        match_rows = (await self._db.execute(match_query)).all()
        matches_by_loop = {row.loop_id: row.cnt for row in match_rows}

        app_query = (
            select(Application.loop_id, func.count().label("cnt"))
            .where(
                Application.loop_id.in_(str_ids),
                Application.archived.is_(False),
            )
            .group_by(Application.loop_id)
        )
        app_rows = (await self._db.execute(app_query)).all()
        apps_by_loop = {row.loop_id: row.cnt for row in app_rows if row.loop_id}

        return {
            lid: {
                "matches_saved": matches_by_loop.get(lid, 0),
                "applications_total": apps_by_loop.get(lid, 0),
            }
            for lid in str_ids
        }
