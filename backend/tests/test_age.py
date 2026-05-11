"""Unit tests for pipeline age helper.

All tests use a frozen `now` so they never depend on wall-clock time.
"""
from __future__ import annotations

from datetime import UTC, datetime

import pytest

from app.modules.applications.age import compute_age


def _dt(year: int, month: int, day: int, hour: int = 0) -> datetime:
    return datetime(year, month, day, hour, tzinfo=UTC)


def test_days_in_pipeline_exact_days():
    created = _dt(2024, 1, 1)
    now = _dt(2024, 1, 6)
    result = compute_age(created, None, created, now=now)
    assert result["days_in_pipeline"] == 5


def test_days_in_pipeline_same_moment_is_zero():
    t = _dt(2024, 3, 15, 12)
    result = compute_age(t, None, t, now=t)
    assert result["days_in_pipeline"] == 0


def test_days_in_pipeline_partial_day_rounds_down():
    created = _dt(2024, 1, 1, 6)   # 06:00 UTC
    now = _dt(2024, 1, 2, 5)       # next day 05:00 — only 23 h later
    result = compute_age(created, None, created, now=now)
    assert result["days_in_pipeline"] == 0


def test_days_since_applied_null_when_no_applied_at():
    t = _dt(2024, 1, 1)
    result = compute_age(t, None, t, now=_dt(2024, 1, 10))
    assert result["days_since_applied"] is None


def test_days_since_applied_when_present():
    created = _dt(2024, 1, 1)
    applied = _dt(2024, 1, 3)
    now = _dt(2024, 1, 6)
    result = compute_age(created, applied, created, now=now)
    assert result["days_since_applied"] == 3


def test_days_since_applied_same_day_as_now():
    t = _dt(2024, 5, 1)
    result = compute_age(t, t, t, now=t)
    assert result["days_since_applied"] == 0


def test_days_in_current_status():
    created = _dt(2024, 1, 1)
    last_change = _dt(2024, 1, 4)
    now = _dt(2024, 1, 6)
    result = compute_age(created, None, last_change, now=now)
    assert result["days_in_current_status"] == 2


def test_days_never_negative_on_clock_skew():
    created = _dt(2024, 1, 5)   # created "in the future" vs now
    now = _dt(2024, 1, 1)
    result = compute_age(created, created, created, now=now)
    assert result["days_in_pipeline"] == 0
    assert result["days_since_applied"] == 0
    assert result["days_in_current_status"] == 0


def test_all_fields_present():
    t = _dt(2024, 6, 1)
    result = compute_age(t, t, t, now=_dt(2024, 6, 10))
    assert "days_in_pipeline" in result
    assert "days_since_applied" in result
    assert "days_in_current_status" in result


def test_naive_datetimes_treated_as_utc():
    created = datetime(2024, 1, 1)          # naive
    now = datetime(2024, 1, 6, tzinfo=UTC)  # aware
    result = compute_age(created, None, created, now=now)
    assert result["days_in_pipeline"] == 5
