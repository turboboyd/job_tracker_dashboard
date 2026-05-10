from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application


class ApplicationsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def get_by_id(self, app_id: UUID) -> Application | None:
        result = await self._db.execute(
            select(Application).where(Application.id == app_id)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        archived: bool = False,
        statuses: list[str] | None = None,
        limit: int = 200,
    ) -> list[Application]:
        q = select(Application).where(
            Application.user_id == user_id,
            Application.archived == archived,
        )
        if statuses:
            q = q.where(Application.status.in_(statuses))
        q = q.order_by(Application.created_at.desc()).limit(limit)
        result = await self._db.execute(q)
        return list(result.scalars().all())

    async def create(self, app: Application) -> Application:
        self._db.add(app)
        await self._db.flush()
        await self._db.refresh(app)
        return app

    async def patch(self, app: Application, updates: dict) -> Application:
        for field, value in updates.items():
            setattr(app, field, value)
        app.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(app)
        return app

    async def delete(self, app: Application) -> None:
        await self._db.delete(app)
        await self._db.flush()
