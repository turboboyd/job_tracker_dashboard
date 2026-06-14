"""Unit tests for the scheduler's wall-clock alignment helper.

``_next_aligned_run_at`` snaps the next refresh to a midnight-aligned Berlin
boundary (every ``interval_hours`` → 00:00, 04:00, 08:00 … local) instead of
adding the interval to "now". These guard the boundary math, the day rollover,
and DST-safety (snapping the local hour, not adding a timedelta).
"""

from __future__ import annotations

from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import pytest

from app import scheduler
from app.scheduler import _next_aligned_run_at

BERLIN = ZoneInfo("Europe/Berlin")


def _berlin(local_iso: str) -> datetime:
    """Interpret a naive local timestamp as Europe/Berlin, return aware UTC."""
    return datetime.fromisoformat(local_iso).replace(tzinfo=BERLIN).astimezone(timezone.utc)


@pytest.mark.parametrize(
    ("now_local", "expected_local"),
    [
        # Mid-window (CEST) → next 4h boundary.
        ("2026-06-08T12:38:00", "2026-06-08T16:00:00"),
        ("2026-06-08T03:59:00", "2026-06-08T04:00:00"),
        # Exactly on a boundary → strictly *after*, so the next one.
        ("2026-06-08T00:00:00", "2026-06-08T04:00:00"),
        ("2026-06-08T16:00:00", "2026-06-08T20:00:00"),
        # Last boundary of the day / past it → tomorrow's midnight.
        ("2026-06-08T20:00:00", "2026-06-09T00:00:00"),
        ("2026-06-08T21:30:00", "2026-06-09T00:00:00"),
        ("2026-06-08T23:59:00", "2026-06-09T00:00:00"),
    ],
)
def test_next_aligned_run_at_snaps_to_berlin_boundaries(
    now_local: str, expected_local: str
) -> None:
    result = _next_aligned_run_at(_berlin(now_local), 4)
    assert result == _berlin(expected_local)


def test_next_aligned_run_at_is_tz_aware_utc() -> None:
    result = _next_aligned_run_at(_berlin("2026-06-08T12:00:00"), 4)
    assert result.tzinfo == timezone.utc


def test_next_aligned_run_at_handles_dst_spring_forward() -> None:
    """29 Mar 2026 skips 02:00→03:00 local. The 00:00 boundary at 23:30 local
    the night before must land on the real local midnight, not be off by an
    hour — verified by round-tripping back into the Berlin zone."""
    before_midnight = _berlin("2026-03-28T23:30:00")
    result = _next_aligned_run_at(before_midnight, 4)
    local = result.astimezone(BERLIN)
    assert (local.hour, local.minute) == (0, 0)


def test_next_aligned_run_at_falls_back_without_tzdata(monkeypatch: pytest.MonkeyPatch) -> None:
    """If tz data is unavailable, the helper degrades to interval arithmetic
    rather than crashing the scheduler."""
    monkeypatch.setattr(scheduler, "BERLIN_TZ", None)
    now = datetime(2026, 6, 8, 12, 38, tzinfo=timezone.utc)
    result = _next_aligned_run_at(now, 4)
    assert result == datetime(2026, 6, 8, 16, 38, tzinfo=timezone.utc)
