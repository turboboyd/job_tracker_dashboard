from uuid import UUID

from sqlalchemy import func, select
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
        *,
        limit: int = 20,
        offset: int = 0,
        event_type: str | None = None,
    ) -> tuple[list[ApplicationHistory], int]:
        conditions = [
            ApplicationHistory.application_id == application_id,
            ApplicationHistory.user_id == user_id,
        ]
        if event_type is not None:
            conditions.append(ApplicationHistory.type == event_type)

        total: int = (
            await self._db.execute(
                select(func.count()).select_from(ApplicationHistory).where(*conditions)
            )
        ).scalar_one()

        q = (
            select(ApplicationHistory)
            .where(*conditions)
            .order_by(ApplicationHistory.created_at.desc(), ApplicationHistory.id.asc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._db.execute(q)
        return list(result.scalars().all()), total
