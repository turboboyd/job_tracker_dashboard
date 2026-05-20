from __future__ import annotations

import uuid
from datetime import datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.application_history import ApplicationHistory
from app.db.models.user import User
from app.modules.history.repository import HistoryRepository


def _serialize(value: object) -> object:
    """Make a field value safe for JSONB storage."""
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, uuid.UUID):
        return str(value)
    return value


def _wrap(value: object) -> dict | None:
    """Wrap a field value in {"v": ...} for uniform JSONB storage."""
    if value is None:
        return None
    return {"v": _serialize(value)}


class HistoryService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = HistoryRepository(db)

    async def record_created(
        self,
        app: Application,
        user_id: UUID,
    ) -> ApplicationHistory:
        return await self._repo.create(
            ApplicationHistory(
                application_id=app.id,
                user_id=user_id,
                actor="user",
                type="APPLICATION_CREATED",
            )
        )

    async def record_status_change(
        self,
        app_id: UUID,
        user_id: UUID,
        from_status: str,
        to_status: str,
        comment: str | None = None,
        correlation_id: str | None = None,
    ) -> ApplicationHistory:
        return await self._repo.create(
            ApplicationHistory(
                application_id=app_id,
                user_id=user_id,
                actor="user",
                type="STATUS_CHANGE",
                from_status=from_status,
                to_status=to_status,
                comment=comment,
                correlation_id=correlation_id,
            )
        )

    async def record_field_change(
        self,
        app_id: UUID,
        user_id: UUID,
        field_path: str,
        old_value: object,
        new_value: object,
    ) -> ApplicationHistory:
        return await self._repo.create(
            ApplicationHistory(
                application_id=app_id,
                user_id=user_id,
                actor="user",
                type="FIELD_CHANGE",
                field_path=field_path,
                old_value=_wrap(old_value),
                new_value=_wrap(new_value),
            )
        )

    async def record_comment(
        self,
        app_id: UUID,
        user_id: UUID,
        text: str,
        feedback_type: str | None = None,
        sentiment: str | None = None,
        rejection_reason_code: str | None = None,
        correlation_id: str | None = None,
    ) -> ApplicationHistory:
        return await self._repo.create(
            ApplicationHistory(
                application_id=app_id,
                user_id=user_id,
                actor="user",
                type="COMMENT",
                comment=text,
                feedback_type=feedback_type,
                sentiment=sentiment,
                rejection_reason_code=rejection_reason_code,
                correlation_id=correlation_id,
            )
        )

    async def record_archived(
        self,
        app_id: UUID,
        user_id: UUID,
    ) -> ApplicationHistory:
        return await self._repo.create(
            ApplicationHistory(
                application_id=app_id,
                user_id=user_id,
                actor="user",
                type="APPLICATION_ARCHIVED",
            )
        )

    async def list_for_application(
        self,
        user: User,
        app_id: UUID,
        *,
        limit: int = 20,
        offset: int = 0,
        event_type: str | None = None,
    ) -> tuple[list[ApplicationHistory], int]:
        return await self._repo.list_for_application(
            app_id,
            user.id,
            limit=limit,
            offset=offset,
            event_type=event_type,
        )
