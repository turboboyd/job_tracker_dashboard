from __future__ import annotations

from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession

from .repository import AnalyticsRepository
from .schemas import KpiResponse, RangeParam


def _rate(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


class AnalyticsService:
    def __init__(self, db: AsyncSession) -> None:
        self._repo = AnalyticsRepository(db)

    async def get_kpi(self, user_id: UUID, range_key: RangeParam) -> KpiResponse:
        raw = await self._repo.compute_kpi(user_id, range_key)
        applied = raw["applied"]

        return KpiResponse(
            range=range_key,
            total_applications=raw["total"],
            active_applications=raw["active"],
            archived_applications=raw["archived"],
            status_counts=raw["status_counts"],
            follow_ups_due=raw["follow_ups_due"],
            applied_count=applied,
            interview_count=raw["interview"],
            offer_count=raw["offer"],
            rejected_count=raw["rejected"],
            response_rate=_rate(raw["with_response"], applied),
            interview_rate=_rate(raw["interview"], applied),
            offer_rate=_rate(raw["offer"], applied),
        )
