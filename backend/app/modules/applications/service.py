"""Business logic for Applications: create, read, patch, archive, delete."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.user import User
from app.modules.applications.derived import apply_derived
from app.modules.applications.repository import ApplicationsRepository
from app.modules.applications.schemas import ApplicationCreate, ApplicationPatch


def _jsonb_safe(value: object) -> object:
    """Round-trip through JSON to make a value safe for JSONB storage.

    Converts datetimes to ISO strings, UUIDs to strings, etc.
    """
    return json.loads(
        json.dumps(
            value,
            default=lambda o: o.isoformat() if isinstance(o, datetime) else str(o),
        )
    )


class ApplicationsService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = ApplicationsRepository(db)

    async def list_for_user(
        self,
        user: User,
        *,
        archived: bool = False,
        statuses: list[str] | None = None,
    ) -> list[Application]:
        return await self._repo.list_for_user(
            user.id, archived=archived, statuses=statuses
        )

    async def create(self, user: User, payload: ApplicationCreate) -> Application:
        data = payload.model_dump(exclude_none=True)

        # Serialise nested Pydantic models for JSONB columns
        if "salary" in data:
            data["salary"] = _jsonb_safe(data["salary"])
        if "reminders" in data:
            data["reminders"] = _jsonb_safe(data["reminders"])

        data["user_id"] = user.id
        data["last_status_change_at"] = datetime.now(UTC)
        apply_derived(data)

        return await self._repo.create(Application(**data))

    async def get_owned(self, user: User, app_id: UUID) -> Application | None:
        """Return the application only if it belongs to this user."""
        app = await self._repo.get_by_id(app_id)
        if app is None or app.user_id != user.id:
            return None
        return app

    async def patch(self, app: Application, payload: ApplicationPatch) -> Application:
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return app

        # Serialise JSONB fields
        if "salary" in updates:
            updates["salary"] = _jsonb_safe(updates["salary"])
        if "reminders" in updates:
            updates["reminders"] = _jsonb_safe(updates["reminders"])

        # Bump last_status_change_at when status actually changes
        if "status" in updates and updates["status"] != app.status:
            updates["last_status_change_at"] = datetime.now(UTC)

        # Recompute derived fields from the merged state
        merged_inputs = {
            "status": updates.get("status", app.status),
            "last_contact_at": updates.get("last_contact_at", app.last_contact_at),
            "follow_up_level": updates.get("follow_up_level", app.follow_up_level),
            "applied_at": updates.get("applied_at", app.applied_at),
        }
        apply_derived(merged_inputs)
        for key in ("stage", "needs_follow_up", "follow_up_due_at",
                    "needs_reapply_suggestion", "reapply_eligible_at"):
            updates[key] = merged_inputs[key]

        return await self._repo.patch(app, updates)

    async def archive(self, app: Application) -> Application:
        return await self._repo.patch(app, {"archived": True})

    async def delete(self, app: Application) -> None:
        await self._repo.delete(app)
