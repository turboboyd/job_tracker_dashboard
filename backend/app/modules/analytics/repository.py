from __future__ import annotations

from datetime import UTC, datetime, timedelta
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application

# Days in each named range; None means no time filter.
_RANGE_DAYS: dict[str, int | None] = {
    "7d": 7,
    "30d": 30,
    "90d": 90,
    "all": None,
}

# Statuses that imply the application was actually submitted (past SAVED/PLANNED).
_APPLIED_STATUSES = frozenset({
    "APPLIED", "VIEWED", "INTERVIEW_1", "INTERVIEW_2",
    "TEST_TASK", "OFFER", "REJECTED", "NO_RESPONSE", "WITHDREW",
})

# Statuses that imply the employer took a meaningful action (i.e. a response was received).
# Used for response_rate numerator.
_RESPONSE_STATUSES = frozenset({
    "VIEWED", "INTERVIEW_1", "INTERVIEW_2", "TEST_TASK", "OFFER", "REJECTED",
})

_INTERVIEW_STATUSES = frozenset({"INTERVIEW_1", "INTERVIEW_2", "TEST_TASK"})
_OFFER_STATUSES = frozenset({"OFFER"})
_REJECTED_STATUSES = frozenset({"REJECTED", "NO_RESPONSE"})


class AnalyticsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    def _since(self, range_key: str) -> datetime | None:
        days = _RANGE_DAYS[range_key]
        if days is None:
            return None
        return datetime.now(UTC) - timedelta(days=days)

    async def compute_kpi(self, user_id: UUID, range_key: str) -> dict:
        since = self._since(range_key)

        # Single aggregation query: per (status, archived) row counts.
        agg_q = (
            select(
                Application.status,
                Application.archived,
                func.count().label("cnt"),
            )
            .where(Application.user_id == user_id)
        )
        if since is not None:
            agg_q = agg_q.where(Application.created_at >= since)
        agg_q = agg_q.group_by(Application.status, Application.archived)

        rows = (await self._db.execute(agg_q)).all()

        # Separate query for follow_ups_due (overdue and not archived).
        fu_q = select(func.count()).where(
            Application.user_id == user_id,
            Application.archived.is_(False),
            Application.needs_follow_up.is_(True),
            Application.follow_up_due_at <= datetime.now(UTC),
        )
        if since is not None:
            fu_q = fu_q.where(Application.created_at >= since)

        follow_ups_due: int = (await self._db.execute(fu_q)).scalar_one()

        # Aggregate raw rows into KPI buckets.
        total = active = archived = 0
        applied = with_response = interview = offer = rejected = 0
        status_counts: dict[str, int] = {}

        for status, is_archived, cnt in rows:
            total += cnt
            if is_archived:
                archived += cnt
            else:
                active += cnt
            # status_counts covers all applications (active + archived).
            status_counts[status] = status_counts.get(status, 0) + cnt

            if status in _APPLIED_STATUSES:
                applied += cnt
            if status in _RESPONSE_STATUSES:
                with_response += cnt
            if status in _INTERVIEW_STATUSES:
                interview += cnt
            if status in _OFFER_STATUSES:
                offer += cnt
            if status in _REJECTED_STATUSES:
                rejected += cnt

        return {
            "total": total,
            "active": active,
            "archived": archived,
            "status_counts": status_counts,
            "follow_ups_due": follow_ups_due,
            "applied": applied,
            "with_response": with_response,
            "interview": interview,
            "offer": offer,
            "rejected": rejected,
        }
