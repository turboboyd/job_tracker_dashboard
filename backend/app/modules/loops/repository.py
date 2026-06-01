from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.discovery_run_record import DiscoveryRunRecord
from app.db.models.loop import Loop
from app.db.models.vacancy_match import VacancyMatch

# Mirror the analytics module status sets so per-loop funnel matches /analytics/kpi.
_APPLIED_STATUSES = frozenset({
    "APPLIED", "VIEWED", "INTERVIEW_1", "INTERVIEW_2",
    "TEST_TASK", "OFFER", "REJECTED", "NO_RESPONSE", "WITHDREW",
})
_RESPONSE_STATUSES = frozenset({
    "VIEWED", "INTERVIEW_1", "INTERVIEW_2", "TEST_TASK", "OFFER", "REJECTED",
})
_INTERVIEW_STATUSES = frozenset({"INTERVIEW_1", "INTERVIEW_2", "TEST_TASK"})
_OFFER_STATUSES = frozenset({"OFFER"})
_REJECTED_STATUSES = frozenset({"REJECTED", "NO_RESPONSE"})


def _rate(numerator: int, denominator: int) -> float:
    if denominator == 0:
        return 0.0
    return round(numerator / denominator, 4)


def _empty_metrics() -> dict[str, float | int]:
    return {
        "matches_saved": 0,
        "applications_total": 0,
        "applied_count": 0,
        "interview_count": 0,
        "offer_count": 0,
        "rejected_count": 0,
        "response_rate": 0.0,
        "interview_rate": 0.0,
        "offer_rate": 0.0,
    }


class LoopsRepository:
    def __init__(self, db: AsyncSession) -> None:
        self._db = db

    async def create(self, loop: Loop) -> Loop:
        self._db.add(loop)
        await self._db.flush()
        await self._db.refresh(loop)
        return loop

    async def get_by_id(self, loop_id: UUID) -> Loop | None:
        result = await self._db.execute(select(Loop).where(Loop.id == loop_id))
        return result.scalar_one_or_none()

    async def get_owned(self, user_id: UUID, loop_id: UUID) -> Loop | None:
        result = await self._db.execute(
            select(Loop).where(Loop.id == loop_id, Loop.user_id == user_id)
        )
        return result.scalar_one_or_none()

    async def list_for_user(
        self,
        user_id: UUID,
        *,
        include_archived: bool = False,
        limit: int = 50,
        offset: int = 0,
    ) -> tuple[list[Loop], int]:
        conditions = [Loop.user_id == user_id]
        if not include_archived:
            conditions.append(Loop.status != "archived")

        count_query = select(func.count()).select_from(Loop).where(*conditions)
        total = (await self._db.execute(count_query)).scalar_one()
        result = await self._db.execute(
            select(Loop)
            .where(*conditions)
            .order_by(Loop.updated_at.desc(), Loop.id.asc())
            .limit(limit)
            .offset(offset)
        )
        return list(result.scalars().all()), total

    async def patch(self, loop: Loop, updates: dict) -> Loop:
        for field, value in updates.items():
            setattr(loop, field, value)
        loop.updated_at = datetime.now(UTC)
        await self._db.flush()
        await self._db.refresh(loop)
        return loop

    async def get_metrics_by_loop_ids(
        self, loop_ids: list[UUID]
    ) -> dict[str, dict[str, float | int]]:
        if not loop_ids:
            return {}

        str_ids = [str(lid) for lid in loop_ids]

        match_query = (
            select(VacancyMatch.loop_id, func.count().label("cnt"))
            .where(
                VacancyMatch.loop_id.in_(str_ids),
                VacancyMatch.status.in_(["new", "saved"]),
            )
            .group_by(VacancyMatch.loop_id)
        )
        match_rows = (await self._db.execute(match_query)).all()
        matches_by_loop = {row.loop_id: row.cnt for row in match_rows}

        # Per-loop funnel buckets, grouped by (loop_id, status) for active applications.
        funnel_query = (
            select(
                Application.loop_id,
                Application.status,
                func.count().label("cnt"),
            )
            .where(
                Application.loop_id.in_(str_ids),
                Application.archived.is_(False),
                Application.loop_id.is_not(None),
            )
            .group_by(Application.loop_id, Application.status)
        )
        funnel_rows = (await self._db.execute(funnel_query)).all()

        per_loop: dict[str, dict[str, float | int]] = {}
        for lid in str_ids:
            per_loop[lid] = _empty_metrics()
            per_loop[lid]["matches_saved"] = matches_by_loop.get(lid, 0)

        for loop_id_value, status, cnt in funnel_rows:
            bucket = per_loop.setdefault(loop_id_value, _empty_metrics())
            bucket["applications_total"] = int(bucket["applications_total"]) + cnt
            if status in _APPLIED_STATUSES:
                bucket["applied_count"] = int(bucket["applied_count"]) + cnt
            if status in _RESPONSE_STATUSES:
                bucket["_with_response"] = int(bucket.get("_with_response", 0)) + cnt
            if status in _INTERVIEW_STATUSES:
                bucket["interview_count"] = int(bucket["interview_count"]) + cnt
            if status in _OFFER_STATUSES:
                bucket["offer_count"] = int(bucket["offer_count"]) + cnt
            if status in _REJECTED_STATUSES:
                bucket["rejected_count"] = int(bucket["rejected_count"]) + cnt

        for bucket in per_loop.values():
            applied = int(bucket["applied_count"])
            with_response = int(bucket.pop("_with_response", 0))
            bucket["response_rate"] = _rate(with_response, applied)
            bucket["interview_rate"] = _rate(int(bucket["interview_count"]), applied)
            bucket["offer_rate"] = _rate(int(bucket["offer_count"]), applied)

        return per_loop

    async def get_source_stats_for_loop(
        self, loop_id: UUID, user_id: UUID
    ) -> list[dict]:
        # Match counts + converted counts per source
        match_rows = (
            await self._db.execute(
                select(
                    VacancyMatch.source,
                    func.count().label("total"),
                    func.count()
                    .filter(VacancyMatch.status == "converted")
                    .label("converted"),
                )
                .where(
                    VacancyMatch.loop_id == str(loop_id),
                    VacancyMatch.user_id == user_id,
                )
                .group_by(VacancyMatch.source)
            )
        ).all()

        # Last (finished_at, status) per source from run records (processed in Python)
        run_rows = (
            await self._db.execute(
                select(
                    DiscoveryRunRecord.sources,
                    DiscoveryRunRecord.finished_at,
                    DiscoveryRunRecord.status,
                )
                .where(
                    DiscoveryRunRecord.loop_id == loop_id,
                    DiscoveryRunRecord.user_id == user_id,
                )
                .order_by(DiscoveryRunRecord.finished_at.desc())
            )
        ).all()

        last_run_by_source: dict[str, tuple[datetime, str]] = {}
        for sources_list, finished_at, run_status in run_rows:
            for src in sources_list or []:
                key = src.lower()
                if key not in last_run_by_source:
                    last_run_by_source[key] = (finished_at, run_status)

        def _health(run_status: str) -> str:
            if run_status == "completed":
                return "ok"
            if run_status in ("completed_with_warnings", "skipped"):
                return "warning"
            return "error"

        result: list[dict] = []
        seen_sources: set[str] = set()
        for row in match_rows:
            source_id = row.source or "unknown"
            key = source_id.lower()
            seen_sources.add(key)
            last = last_run_by_source.get(key)
            result.append({
                "source_id": source_id,
                "matches": row.total,
                "applied": row.converted,
                "last_run_at": last[0] if last else None,
                "health": _health(last[1]) if last else "never",
            })

        # Include sources that ran but produced no matches yet
        for src, (last_run, run_status) in last_run_by_source.items():
            if src not in seen_sources:
                result.append({
                    "source_id": src,
                    "matches": 0,
                    "applied": 0,
                    "last_run_at": last_run,
                    "health": _health(run_status),
                })

        result.sort(key=lambda x: x["matches"], reverse=True)
        return result
