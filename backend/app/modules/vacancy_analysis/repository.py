from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.vacancy_analysis import AnalysisUsageDaily, VacancyMatchAnalysis


class VacancyAnalysisRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create_analysis(self, analysis: VacancyMatchAnalysis) -> VacancyMatchAnalysis:
        self._db.add(analysis)
        await self._db.flush()
        await self._db.refresh(analysis)
        return analysis

    async def list_for_match(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[VacancyMatchAnalysis], int]:
        conditions = [
            VacancyMatchAnalysis.user_id == user_id,
            VacancyMatchAnalysis.loop_id == loop_id,
            VacancyMatchAnalysis.match_id == match_id,
        ]
        total = (
            await self._db.execute(
                select(func.count()).select_from(VacancyMatchAnalysis).where(*conditions)
            )
        ).scalar_one()
        result = await self._db.execute(
            select(VacancyMatchAnalysis)
            .where(*conditions)
            .order_by(VacancyMatchAnalysis.created_at.desc(), VacancyMatchAnalysis.id.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def latest_for_match(
        self,
        *,
        user_id: UUID,
        loop_id: str,
        match_id: UUID,
    ) -> VacancyMatchAnalysis | None:
        result = await self._db.execute(
            select(VacancyMatchAnalysis)
            .where(
                VacancyMatchAnalysis.user_id == user_id,
                VacancyMatchAnalysis.loop_id == loop_id,
                VacancyMatchAnalysis.match_id == match_id,
            )
            .order_by(VacancyMatchAnalysis.created_at.desc(), VacancyMatchAnalysis.id.asc())
            .limit(1)
        )
        return result.scalar_one_or_none()

    async def get_or_create_usage(
        self,
        *,
        user_id: UUID,
        day: date,
        plan: str,
    ) -> AnalysisUsageDaily:
        result = await self._db.execute(
            select(AnalysisUsageDaily).where(
                AnalysisUsageDaily.user_id == user_id,
                AnalysisUsageDaily.day == day,
            )
        )
        usage = result.scalar_one_or_none()
        if usage is not None:
            if usage.plan != plan:
                usage.plan = plan
                usage.updated_at = datetime.now(UTC)
                await self._db.flush()
                await self._db.refresh(usage)
            return usage

        usage = AnalysisUsageDaily(user_id=user_id, day=day, plan=plan)
        self._db.add(usage)
        await self._db.flush()
        await self._db.refresh(usage)
        return usage

    async def increment_usage(
        self,
        usage: AnalysisUsageDaily,
        analysis_type: str,
    ) -> AnalysisUsageDaily:
        if analysis_type == "basic":
            usage.basic_used += 1
        else:
            usage.ai_used += 1
        usage.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(usage)
        return usage
