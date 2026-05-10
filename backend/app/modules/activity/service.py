from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.activity_event import ActivityEvent
from app.db.models.application import Application
from app.modules.activity.repository import ActivityRepository


class ActivityService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = ActivityRepository(db)

    async def record_created(self, app: Application, user_id: UUID) -> ActivityEvent:
        return await self._repo.create(
            ActivityEvent(
                user_id=user_id,
                application_id=app.id,
                kind="APPLICATION_CREATED",
                title="Application created",
                description=(
                    f"Application for {app.role_title} at {app.company_name} was created."
                ),
                payload={},
            )
        )

    async def record_status_changed(
        self,
        app: Application,
        user_id: UUID,
        from_status: str,
        to_status: str,
    ) -> ActivityEvent:
        return await self._repo.create(
            ActivityEvent(
                user_id=user_id,
                application_id=app.id,
                kind="STATUS_CHANGED",
                title="Status changed",
                description=f"Status changed from {from_status} to {to_status}.",
                payload={"from_status": from_status, "to_status": to_status},
            )
        )

    async def record_updated(self, app: Application, user_id: UUID) -> ActivityEvent:
        return await self._repo.create(
            ActivityEvent(
                user_id=user_id,
                application_id=app.id,
                kind="APPLICATION_UPDATED",
                title="Application updated",
                description=(
                    f"Application for {app.role_title} at {app.company_name} was updated."
                ),
                payload={},
            )
        )

    async def record_comment_added(self, app: Application, user_id: UUID) -> ActivityEvent:
        return await self._repo.create(
            ActivityEvent(
                user_id=user_id,
                application_id=app.id,
                kind="COMMENT_ADDED",
                title="Comment added",
                description=f"Comment added to {app.company_name} application.",
                payload={},
            )
        )

    async def record_archived(self, app: Application, user_id: UUID) -> ActivityEvent:
        return await self._repo.create(
            ActivityEvent(
                user_id=user_id,
                application_id=app.id,
                kind="APPLICATION_ARCHIVED",
                title="Application archived",
                description=(
                    f"Application for {app.role_title} at {app.company_name} was archived."
                ),
                payload={},
            )
        )

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        kind: str | None = None,
        limit: int = 50,
    ) -> list[ActivityEvent]:
        return await self._repo.list_for_user(user_id, kind=kind, limit=limit)
