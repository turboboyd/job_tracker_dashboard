from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.loop import Loop


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
