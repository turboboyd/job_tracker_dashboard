from __future__ import annotations

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
        return await self._repo.patch(loop, updates)

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

    async def duplicate(self, user: User, loop_id: UUID) -> Loop:
        source = await self.get_owned(user, loop_id)
        new_loop = Loop(
            user_id=user.id,
            title=f"{source.title} (copy)",
            target_role=source.target_role,
            location=source.location,
            radius_km=source.radius_km,
            sources=list(source.sources),
            keywords=list(source.keywords),
            excluded_keywords=list(source.excluded_keywords),
            employment_types=list(source.employment_types),
            work_modes=list(source.work_modes),
            selected_sources=list(source.selected_sources),
            auto_discovery_enabled=False,
            discovery_radius_km=source.discovery_radius_km,
            status="active",
        )
        return await self._repo.create(new_loop)

    async def require_owned_for_read(self, user: User, loop_id: str) -> Loop:
        try:
            parsed = UUID(loop_id)
        except ValueError as exc:
            raise LoopNotFoundError() from exc
        loop = await self._repo.get_owned(user.id, parsed)
        if loop is None:
            raise LoopNotFoundError()
        return loop
