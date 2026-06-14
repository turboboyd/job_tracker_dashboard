from __future__ import annotations

from datetime import UTC, datetime
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.application import Application
from app.db.models.discovery_preview_cache import DiscoveryPreviewCache
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

        # Canonical "Saved" funnel stage = status IN ('saved', 'converted').
        # A converted match was intentionally selected by the user, so it stays
        # counted (Found -> Saved -> Applied). This mirrors the global matches
        # feed's saved tab; "new" rows are auto-persisted candidates and are
        # excluded so the per-loop metric matches /api/v1/matches counts.
        match_query = (
            select(VacancyMatch.loop_id, func.count().label("cnt"))
            .where(
                VacancyMatch.loop_id.in_(str_ids),
                VacancyMatch.status.in_(["saved", "converted"]),
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

        # Last cache-warm (fetched_at) per source. Dry-run cache warming never
        # writes a DiscoveryRunRecord, so without this an actively-warmed source
        # would show "Не запускался" even though it's polled every few hours.
        cache_rows = (
            await self._db.execute(
                select(
                    DiscoveryPreviewCache.source_id,
                    func.max(DiscoveryPreviewCache.fetched_at).label("last_fetch"),
                )
                .where(DiscoveryPreviewCache.loop_id == loop_id)
                .group_by(DiscoveryPreviewCache.source_id)
            )
        ).all()
        last_fetch_by_source: dict[str, datetime] = {
            (row.source_id or "").lower(): row.last_fetch for row in cache_rows
        }

        def _health(run_status: str) -> str:
            if run_status == "completed":
                return "ok"
            if run_status in ("completed_with_warnings", "skipped"):
                return "warning"
            return "error"

        def _last_poll(key: str) -> tuple[datetime | None, str]:
            """Most recent activity for a source — run record or cache warm."""
            run = last_run_by_source.get(key)
            fetch = last_fetch_by_source.get(key)
            if run and fetch:
                # Whichever happened most recently wins; a successful warm = ok.
                if fetch >= run[0]:
                    return fetch, "ok"
                return run[0], _health(run[1])
            if run:
                return run[0], _health(run[1])
            if fetch:
                return fetch, "ok"
            return None, "never"

        result: list[dict] = []
        seen_sources: set[str] = set()
        for row in match_rows:
            source_id = row.source or "unknown"
            key = source_id.lower()
            seen_sources.add(key)
            last_run_at, health = _last_poll(key)
            result.append({
                "source_id": source_id,
                "matches": row.total,
                "applied": row.converted,
                "last_run_at": last_run_at,
                "health": health,
            })

        # Include sources that were polled/ran but have no saved matches yet.
        for key in set(last_run_by_source) | set(last_fetch_by_source):
            if key in seen_sources:
                continue
            last_run_at, health = _last_poll(key)
            result.append({
                "source_id": key,
                "matches": 0,
                "applied": 0,
                "last_run_at": last_run_at,
                "health": health,
            })

        result.sort(key=lambda x: x["matches"], reverse=True)
        return result
