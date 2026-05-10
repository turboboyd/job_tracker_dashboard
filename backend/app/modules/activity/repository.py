from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.activity_event import ActivityEvent


class ActivityRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, event: ActivityEvent) -> ActivityEvent:
        self._db.add(event)
        await self._db.flush()
        await self._db.refresh(event)
        return event

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        kind: str | None = None,
        limit: int = 50,
    ) -> list[ActivityEvent]:
        q = (
            select(ActivityEvent)
            .where(ActivityEvent.user_id == user_id)
        )
        if kind is not None:
            q = q.where(ActivityEvent.kind == kind)
        q = q.order_by(ActivityEvent.created_at.desc()).limit(limit)
        result = await self._db.execute(q)
        return list(result.scalars().all())
