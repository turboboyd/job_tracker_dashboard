from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.vacancy_match import VacancyMatch
from app.db.models.vacancy_preview_ignore import VacancyPreviewIgnore


class VacancyMatchesRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, match: VacancyMatch) -> VacancyMatch:
        self._db.add(match)
        await self._db.flush()
        await self._db.refresh(match)
        return match

    async def get_owned_in_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatch | None:
        result = await self._db.execute(
            select(VacancyMatch).where(
                VacancyMatch.id == match_id,
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        status: str | None = None,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[VacancyMatch], int]:
        conditions = [VacancyMatch.user_id == user_id, VacancyMatch.loop_id == loop_id]
        if status:
            conditions.append(VacancyMatch.status == status)

        count_query = select(func.count()).select_from(VacancyMatch).where(*conditions)
        total = (await self._db.execute(count_query)).scalar_one()
        result = await self._db.execute(
            select(VacancyMatch)
            .where(*conditions)
            .order_by(VacancyMatch.updated_at.desc(), VacancyMatch.id.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_by_source_external_id(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source: str,
        external_id: str,
    ) -> VacancyMatch | None:
        result = await self._db.execute(
            select(VacancyMatch).where(
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
                VacancyMatch.source == source,
                VacancyMatch.external_id == external_id,
            )
        )
        return result.scalar_one_or_none()

    async def list_for_source(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source: str,
    ) -> list[VacancyMatch]:
        result = await self._db.execute(
            select(VacancyMatch)
            .where(
                VacancyMatch.user_id == user_id,
                VacancyMatch.loop_id == loop_id,
                VacancyMatch.source == source,
            )
            .order_by(VacancyMatch.updated_at.desc(), VacancyMatch.id.asc())
        )
        return list(result.scalars().all())

    async def patch(self, match: VacancyMatch, updates: dict) -> VacancyMatch:
        for field, value in updates.items():
            setattr(match, field, value)
        match.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(match)
        return match

    async def create_preview_ignore(
        self,
        ignore: VacancyPreviewIgnore,
    ) -> VacancyPreviewIgnore:
        self._db.add(ignore)
        await self._db.flush()
        await self._db.refresh(ignore)
        return ignore

    async def get_preview_ignore_by_source_external_id(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source_id: str,
        external_id: str,
    ) -> VacancyPreviewIgnore | None:
        result = await self._db.execute(
            select(VacancyPreviewIgnore).where(
                VacancyPreviewIgnore.user_id == user_id,
                VacancyPreviewIgnore.loop_id == loop_id,
                VacancyPreviewIgnore.source_id == source_id,
                VacancyPreviewIgnore.external_id == external_id,
            )
        )
        return result.scalar_one_or_none()

    async def get_preview_ignore_by_source_url(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        source_id: str,
        source_url: str,
    ) -> VacancyPreviewIgnore | None:
        result = await self._db.execute(
            select(VacancyPreviewIgnore).where(
                VacancyPreviewIgnore.user_id == user_id,
                VacancyPreviewIgnore.loop_id == loop_id,
                VacancyPreviewIgnore.source_id == source_id,
                VacancyPreviewIgnore.source_url == source_url,
            )
        )
        return result.scalar_one_or_none()

    async def list_preview_ignores_for_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        limit: int = 200,
        offset: int = 0,
    ) -> tuple[list[VacancyPreviewIgnore], int]:
        conditions = [
            VacancyPreviewIgnore.user_id == user_id,
            VacancyPreviewIgnore.loop_id == loop_id,
        ]
        count_query = select(func.count()).select_from(VacancyPreviewIgnore).where(*conditions)
        total = (await self._db.execute(count_query)).scalar_one()
        result = await self._db.execute(
            select(VacancyPreviewIgnore)
            .where(*conditions)
            .order_by(VacancyPreviewIgnore.updated_at.desc(), VacancyPreviewIgnore.id.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def get_preview_ignore_owned_in_loop(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        ignore_id: UUID,
    ) -> VacancyPreviewIgnore | None:
        result = await self._db.execute(
            select(VacancyPreviewIgnore).where(
                VacancyPreviewIgnore.id == ignore_id,
                VacancyPreviewIgnore.user_id == user_id,
                VacancyPreviewIgnore.loop_id == loop_id,
            )
        )
        return result.scalar_one_or_none()

    async def delete_preview_ignore(self, ignore: VacancyPreviewIgnore) -> None:
        await self._db.delete(ignore)
        await self._db.flush()
