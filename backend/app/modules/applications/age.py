"""Pipeline age helpers — pure functions, no DB access.

All computations are done relative to an explicit `now` parameter so tests
can inject a fixed timestamp without monkeypatching datetime.
"""
from __future__ import annotations

from datetime import UTC, datetime


def _whole_days(later: datetime, earlier: datetime) -> int:
    if earlier.tzinfo is None:
        earlier = earlier.replace(tzinfo=UTC)
    if later.tzinfo is None:
        later = later.replace(tzinfo=UTC)
    return max(0, int((later - earlier).total_seconds() // 86400))


def compute_age(
    created_at: datetime,
    applied_at: datetime | None,
    last_status_change_at: datetime,
    now: datetime | None = None,
) -> dict:
    """Return days_in_pipeline, days_since_applied, days_in_current_status."""
    if now is None:
        now = datetime.now(UTC)
    return {
        "days_in_pipeline": _whole_days(now, created_at),
        "days_since_applied": _whole_days(now, applied_at) if applied_at is not None else None,
        "days_in_current_status": _whole_days(now, last_status_change_at),
    }
