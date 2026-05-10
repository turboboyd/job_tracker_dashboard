from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application_history import ApplicationHistory


class HistoryRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, item: ApplicationHistory) -> ApplicationHistory:
        self._db.add(item)
        await self._db.flush()
        await self._db.refresh(item)
        return item

    async def list_for_application(
        self,
        application_id: UUID,
        user_id: UUID,
        limit: int = 50,
    ) -> list[ApplicationHistory]:
        q = (
            select(ApplicationHistory)
            .where(
                ApplicationHistory.application_id == application_id,
                ApplicationHistory.user_id == user_id,
            )
            .order_by(ApplicationHistory.created_at.desc())
            .limit(limit)
        )
        result = await self._db.execute(q)
        return list(result.scalars().all())
