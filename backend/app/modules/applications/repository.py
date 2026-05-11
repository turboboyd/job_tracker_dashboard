from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application

_SORT_MAP = {
    "created_at_desc": Application.created_at.desc(),
    "created_at_asc": Application.created_at.asc(),
    "updated_at_desc": Application.updated_at.desc(),
    "updated_at_asc": Application.updated_at.asc(),
    "last_status_change_at_desc": Application.last_status_change_at.desc(),
    "last_status_change_at_asc": Application.last_status_change_at.asc(),
}


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
        stage: str | None = None,
        search: str | None = None,
        sort: str = "updated_at_desc",
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Application], int]:
        conditions = [
            Application.user_id == user_id,
            Application.archived == archived,
        ]
        if statuses:
            conditions.append(Application.status.in_(statuses))
        if stage:
            conditions.append(Application.stage == stage)
        if search:
            pattern = f"%{search}%"
            conditions.append(
                or_(
                    Application.company_name.ilike(pattern),
                    Application.role_title.ilike(pattern),
                    Application.location_text.ilike(pattern),
                    Application.source.ilike(pattern),
                )
            )

        count_q = (
            select(func.count())
            .select_from(Application)
            .where(*conditions)
        )
        total: int = (await self._db.execute(count_q)).scalar_one()

        q = (
            select(Application)
            .where(*conditions)
            .order_by(_SORT_MAP[sort], Application.id.asc())
            .limit(limit)
            .offset(offset)
        )
        items = list((await self._db.execute(q)).scalars().all())
        return items, total

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
