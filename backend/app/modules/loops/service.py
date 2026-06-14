from __future__ import annotations

from datetime import datetime, timedelta, timezone
from uuid import UUID

from fastapi import status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import APIError
from app.db.models.loop import Loop
from app.db.models.user import User
from app.modules.loops.repository import LoopsRepository
from app.modules.loops.schemas import LoopCreate, LoopUpdate


class InvalidLoopError(APIError):
    def __init__(self, message: str = "Loop is invalid or unavailable") -> None:
        super().__init__("INVALID_LOOP", message, status.HTTP_422_UNPROCESSABLE_ENTITY)


class LoopNotFoundError(APIError):
    def __init__(self, message: str = "Loop not found") -> None:
        super().__init__("LOOP_NOT_FOUND", message, status.HTTP_404_NOT_FOUND)


class LoopsService:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db
        self._repo = LoopsRepository(db)

    async def list_for_user(
        self,
        user: User,
        *,
        include_archived: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Loop], int]:
        return await self._repo.list_for_user(
            user.id,
            include_archived=include_archived,
            limit=limit,
            offset=offset,
        )

    async def create(self, user: User, payload: LoopCreate) -> Loop:
        data = payload.model_dump()
        return await self._repo.create(Loop(user_id=user.id, **data))

    async def get_owned(self, user: User, loop_id: UUID) -> Loop:
        loop = await self._repo.get_owned(user.id, loop_id)
        if loop is None:
            raise LoopNotFoundError()
        return loop

    async def patch(self, user: User, loop_id: UUID, payload: LoopUpdate) -> Loop:
        loop = await self.get_owned(user, loop_id)
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        if not updates:
            return loop
        patched = await self._repo.patch(loop, updates)
        # When auto-discovery is enabled and next_run_at is not yet scheduled, schedule it now.
        if patched.auto_discovery_enabled and patched.next_run_at is None:
            interval_h = max(1, patched.discovery_interval_hours or 4)
            patched = await self._repo.patch(
                patched,
                {"next_run_at": datetime.now(timezone.utc) + timedelta(hours=interval_h)},
            )
        # When auto-discovery is disabled, clear the pending run.
        elif not patched.auto_discovery_enabled and patched.next_run_at is not None:
            patched = await self._repo.patch(patched, {"next_run_at": None})

        # Changing what the loop searches for invalidates the persisted match
        # scores — recompute them now (synchronous, capped) so score-ranked
        # lists never disagree with a fresh evaluation. Irrelevant patches
        # (e.g. a title rename) skip this entirely. Imported from the
        # standalone rescore module to avoid a service-level import cycle.
        from app.modules.vacancy_matches.rescore import (
            is_score_relevant_update,
            rescore_loop_matches,
        )

        if is_score_relevant_update(set(updates)):
            await rescore_loop_matches(self._db, patched)
        return patched

    async def archive(self, user: User, loop_id: UUID) -> Loop:
        loop = await self.get_owned(user, loop_id)
        if loop.status == "archived":
            return loop
        return await self._repo.patch(loop, {"status": "archived"})

    async def require_owned_active(self, user: User, loop_id: str) -> Loop:
        try:
            parsed = UUID(loop_id)
        except ValueError as exc:
            raise InvalidLoopError("Loop id must be a valid UUID") from exc
        loop = await self._repo.get_owned(user.id, parsed)
        if loop is None:
            raise InvalidLoopError("Loop does not exist or is not owned by user")
        if loop.status == "archived":
            raise InvalidLoopError("Archived loop cannot be used for new records")
        return loop


    async def require_owned_active_by_user_id(self, user_id: UUID, loop_id: str) -> Loop:
        try:
            parsed = UUID(loop_id)
        except ValueError as exc:
            raise InvalidLoopError("Loop id must be a valid UUID") from exc
        loop = await self._repo.get_owned(user_id, parsed)
        if loop is None:
            raise InvalidLoopError("Loop does not exist or is not owned by user")
        if loop.status == "archived":
            raise InvalidLoopError("Archived loop cannot be used for new records")
        return loop

    async def get_metrics_by_loop_ids(
        self, loop_ids: list[UUID]
    ) -> dict[str, dict[str, int]]:
        return await self._repo.get_metrics_by_loop_ids(loop_ids)

    async def get_source_stats(self, user: User, loop_id: UUID) -> list[dict]:
        await self.get_owned(user, loop_id)
        return await self._repo.get_source_stats_for_loop(loop_id, user.id)

    async def require_owned_for_read(self, user: User, loop_id: str) -> Loop:
        try:
            parsed = UUID(loop_id)
        except ValueError as exc:
            raise LoopNotFoundError() from exc
        loop = await self._repo.get_owned(user.id, parsed)
        if loop is None:
            raise LoopNotFoundError()
        return loop
