"""Business logic for Applications: create, read, patch, archive, delete.

This service is the single orchestration point for application mutations.
It owns history and activity event emission — routers must not call
HistoryService or ActivityService directly for application-related events.
"""

from __future__ import annotations

import json
from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.user import User
from app.modules.activity.service import ActivityService
from app.modules.applications.derived import apply_derived
from app.modules.applications.repository import ApplicationsRepository
from app.modules.applications.schemas import (
    ApplicationCreate,
    ApplicationPatch,
    StatusTransitionRequest,
)
from app.modules.history.service import HistoryService

# Fields that are user-settable and worth tracking per-field on PATCH.
# Derived/system fields (stage, needs_follow_up, last_status_change_at, …)
# are intentionally excluded — they are recomputed automatically.
_TRACKED_PATCH_FIELDS = frozenset({
    "company_name", "role_title", "location_text", "vacancy_url", "source",
    "employment_type", "work_mode", "salary", "posted_at",
    "status", "sub_status", "applied_at", "applied_via",
    "next_action_at", "next_action_text", "contact_attempts",
    "last_contact_at", "last_follow_up_at", "follow_up_level",
    "reapply_reason", "reminders", "current_note", "tags",
    "vacancy_description", "loop_id", "has_loop",
    "cv_version_id", "profile_version_id",
})


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
        self._history = HistoryService(db)
        self._activity = ActivityService(db)

    async def list_for_user(
        self,
        user: User,
        *,
        archived: bool = False,
        statuses: list[str] | None = None,
        stage: str | None = None,
        search: str | None = None,
        sort: str = "updated_at_desc",
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Application], int]:
        return await self._repo.list_for_user(
            user.id,
            archived=archived,
            statuses=statuses,
            stage=stage,
            search=search,
            sort=sort,
            limit=limit,
            offset=offset,
        )

    async def create(self, user: User, payload: ApplicationCreate) -> Application:
        data = payload.model_dump(exclude_none=True)

        if "salary" in data:
            data["salary"] = _jsonb_safe(data["salary"])
        if "reminders" in data:
            data["reminders"] = _jsonb_safe(data["reminders"])

        data["user_id"] = user.id
        data["last_status_change_at"] = datetime.now(UTC)
        apply_derived(data)

        app = await self._repo.create(Application(**data))

        await self._history.record_created(app, user.id)
        await self._activity.record_created(app, user.id)

        return app

    async def get_owned(self, user: User, app_id: UUID) -> Application | None:
        """Return the application only if it belongs to this user."""
        app = await self._repo.get_by_id(app_id)
        if app is None or app.user_id != user.id:
            return None
        return app

    async def patch(
        self,
        app: Application,
        payload: ApplicationPatch,
        user_id: UUID,
    ) -> Application:
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return app

        if "salary" in updates:
            updates["salary"] = _jsonb_safe(updates["salary"])
        if "reminders" in updates:
            updates["reminders"] = _jsonb_safe(updates["reminders"])

        if "status" in updates and updates["status"] != app.status:
            updates["last_status_change_at"] = datetime.now(UTC)

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

        # Snapshot old values of explicitly-sent trackable fields before mutation
        tracked = _TRACKED_PATCH_FIELDS & payload.model_fields_set
        old_snapshot = {f: getattr(app, f, None) for f in tracked}

        updated = await self._repo.patch(app, updates)

        # Emit one FIELD_CHANGE per field that actually changed; skip no-ops
        changed = False
        for field in tracked:
            old_val = old_snapshot[field]
            new_val = getattr(updated, field, None)
            if old_val != new_val:
                await self._history.record_field_change(
                    updated.id, user_id, field, old_val, new_val
                )
                changed = True

        if changed:
            await self._activity.record_updated(updated, user_id)

        return updated

    async def change_status(
        self,
        app: Application,
        payload: StatusTransitionRequest,
        user_id: UUID,
    ) -> Application:
        """Transition to a new status and recompute all derived fields."""
        from_status = app.status

        updates: dict = {
            "status": payload.to_status,
            "last_status_change_at": datetime.now(UTC),
        }

        if "sub_status" in payload.model_fields_set:
            updates["sub_status"] = payload.sub_status

        derived_inputs = {
            "status": payload.to_status,
            "last_contact_at": app.last_contact_at,
            "follow_up_level": app.follow_up_level,
            "applied_at": app.applied_at,
        }
        apply_derived(derived_inputs)
        for key in (
            "stage",
            "needs_follow_up",
            "follow_up_due_at",
            "needs_reapply_suggestion",
            "reapply_eligible_at",
        ):
            updates[key] = derived_inputs[key]

        updated = await self._repo.patch(app, updates)

        await self._history.record_status_change(
            updated.id,
            user_id,
            from_status=from_status,
            to_status=payload.to_status,
            comment=payload.comment,
            correlation_id=payload.correlation_id,
        )
        await self._activity.record_status_changed(
            updated, user_id, from_status, payload.to_status
        )

        return updated

    async def archive(self, app: Application, user_id: UUID) -> Application:
        updated = await self._repo.patch(app, {"archived": True})
        await self._history.record_archived(app.id, user_id)
        await self._activity.record_archived(app, user_id)
        return updated

    async def delete(self, app: Application) -> None:
        await self._repo.delete(app)
