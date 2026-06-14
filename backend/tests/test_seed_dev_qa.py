"""Unit tests for the DEV/QA seed script (Stage 5c).

These tests exercise the pure, importable parts of the script — the safety
guard, the deterministic id helper, and the seed-plan builder — without
touching a database.
"""

from collections import Counter
from datetime import UTC, datetime, timedelta

import pytest

from scripts.seed_dev_qa import (
    LOOP_A_KEY,
    LOOP_B_KEY,
    RESET_TABLE_ORDER,
    SeedGuardError,
    _parse_args,
    _resolve_firebase_uid,
    _sid,
    assert_local_dev_target,
    assert_safe_reset_uid,
    build_reset_statements,
    build_seed_plan,
)

_LOCAL_URLS = [
    "postgresql+asyncpg://postgres:postgres@localhost:5432/job_tracker",
    "postgresql+asyncpg://postgres:postgres@127.0.0.1:5432/job_tracker",
    "postgresql+asyncpg://postgres:postgres@db:5432/job_tracker",
    "postgresql+asyncpg://postgres:postgres@[::1]:5432/job_tracker",
]


# ── Safety guards ────────────────────────────────────────────────────────────


def test_guard_refuses_non_development():
    with pytest.raises(SeedGuardError, match="not 'development'"):
        assert_local_dev_target(False, _LOCAL_URLS[0])


def test_guard_refuses_non_local_host():
    with pytest.raises(SeedGuardError, match="not local"):
        assert_local_dev_target(
            True, "postgresql+asyncpg://u:p@prod.example.com:5432/job_tracker"
        )


@pytest.mark.parametrize("url", _LOCAL_URLS)
def test_guard_accepts_local_hosts(url):
    # Should not raise for any recognised local host.
    assert_local_dev_target(True, url)


# ── Deterministic ids ────────────────────────────────────────────────────────


def test_sid_is_deterministic_and_distinct():
    assert _sid("loop:frontend") == _sid("loop:frontend")
    assert _sid("loop:frontend") != _sid("loop:backend")


# ── Seed plan shape ──────────────────────────────────────────────────────────


@pytest.fixture
def plan():
    now = datetime(2026, 6, 10, 12, 0, 0, tzinfo=UTC)
    return build_seed_plan("dev-qa-user", now)


def test_plan_has_two_loops(plan):
    keys = {loop.key for loop in plan.loops}
    assert keys == {LOOP_A_KEY, LOOP_B_KEY}


def test_plan_total_match_count(plan):
    assert len(plan.matches) == 8


def test_loop_a_has_seven_matches(plan):
    assert len(plan.matches_for(LOOP_A_KEY)) == 7


def test_loop_b_has_one_match(plan):
    assert len(plan.matches_for(LOOP_B_KEY)) == 1


def test_loop_a_status_mix(plan):
    counts = Counter(m.status for m in plan.matches_for(LOOP_A_KEY))
    assert counts == {"new": 4, "saved": 2, "converted": 1}


def test_loop_a_saved_counting_rows(plan):
    saved = [
        m
        for m in plan.matches_for(LOOP_A_KEY)
        if m.status in {"saved", "converted"}
    ]
    assert len(saved) == 3


def test_loop_a_freshness_cases_present(plan):
    now = datetime(2026, 6, 10, 12, 0, 0, tzinfo=UTC)
    loop_a = plan.matches_for(LOOP_A_KEY)

    deltas = {now - m.posted_at for m in loop_a if m.posted_at is not None}
    assert deltas == {
        timedelta(hours=1),
        timedelta(hours=2),
        timedelta(hours=5),
        timedelta(days=2),
        timedelta(days=10),
        timedelta(days=30),
    }

    null_posted = [m for m in loop_a if m.posted_at is None]
    assert len(null_posted) == 1
    # Even with no posted_at, created_at must be set so the COALESCE fallback works.
    assert null_posted[0].created_at is not None


def test_one_converted_match_linked_to_application(plan):
    converted = [m for m in plan.matches if m.status == "converted"]
    assert len(converted) == 1
    assert converted[0].application_key is not None

    app_keys = {app.key for app in plan.applications}
    assert converted[0].application_key in app_keys


def test_plan_has_two_applications(plan):
    assert len(plan.applications) == 2
    statuses = {app.status for app in plan.applications}
    # At least one interview-like status for the Applications page QA.
    assert any(s.startswith("INTERVIEW_") for s in statuses)


def test_seeded_loops_disable_auto_discovery(plan):
    # Auto-discovery must be OFF so the live scheduler cannot flood the seeded
    # loops with real matches and break the deterministic QA dataset. The
    # interval stays at the product default (4h).
    for loop in plan.loops:
        assert loop.auto_discovery_enabled is False
        assert loop.discovery_interval_hours == 4


def test_seed_matches_score_deterministically(plan):
    """The seed scores its matches through the real scoring core at apply time.
    With fixed seed inputs the scores must be deterministic, in range, and
    non-trivial (Loop A's matches share its target role + a selected source)."""
    from app.modules.vacancy_matches.scoring import ScoreInput, score_match

    loop_a = next(loop for loop in plan.loops if loop.key == LOOP_A_KEY)
    matches = plan.matches_for(LOOP_A_KEY)
    assert matches

    totals = []
    for match in matches:
        data = ScoreInput(
            role_title=match.role_title,
            company_name=match.company_name,
            location_text=match.location_text,
            description=None,
            source=match.source,
        )
        first = score_match(loop_a, data)
        second = score_match(loop_a, data)
        assert first.total == second.total  # deterministic
        assert 0 <= first.total <= 100
        assert first.version == 1
        totals.append(first.total)

    assert any(total > 0 for total in totals)


# ── Reset (--reset-dev-qa) ───────────────────────────────────────────────────


def test_reset_requires_apply_flag():
    # Without --apply the reset is a dry-run (no delete is performed).
    dry = _parse_args(["--reset-dev-qa"])
    assert dry.reset_dev_qa is True
    assert dry.apply is False

    live = _parse_args(["--reset-dev-qa", "--apply"])
    assert live.reset_dev_qa is True
    assert live.apply is True


def test_reset_requires_development():
    with pytest.raises(SeedGuardError, match="not 'development'"):
        assert_local_dev_target(False, _LOCAL_URLS[0])


def test_reset_refuses_non_local_db():
    with pytest.raises(SeedGuardError, match="not local"):
        assert_local_dev_target(
            True, "postgresql+asyncpg://u:p@prod.example.com:5432/job_tracker"
        )


def test_assert_safe_reset_uid():
    assert_safe_reset_uid("dev-qa-user")  # concrete uid: must not raise
    for bad in ("", "   "):
        with pytest.raises(SeedGuardError, match="empty"):
            assert_safe_reset_uid(bad)


def test_reset_target_uid_resolution_is_exact(monkeypatch):
    monkeypatch.setenv("DEV_QA_FIREBASE_UID", "emu-uid-xyz")
    assert _resolve_firebase_uid() == "emu-uid-xyz"

    monkeypatch.delenv("DEV_QA_FIREBASE_UID", raising=False)
    assert _resolve_firebase_uid() == "dev-qa-user"


def test_reset_statements_scoped_to_one_user_and_ordered():
    import uuid

    user_id = uuid.uuid4()
    statements = build_reset_statements(user_id)

    assert [name for name, _ in statements] == list(RESET_TABLE_ORDER)

    sql_by_table = {name: str(stmt) for name, stmt in statements}
    # Every delete is filtered — owned tables by user_id, the user row by its pk.
    assert "vacancy_matches.user_id" in sql_by_table["vacancy_matches"]
    assert "applications.user_id" in sql_by_table["applications"]
    assert "loops.user_id" in sql_by_table["loops"]
    assert "users.id" in sql_by_table["users"]


def test_reset_has_no_delete_by_email_or_display_name():
    import uuid

    for _name, stmt in build_reset_statements(uuid.uuid4()):
        sql = str(stmt)
        assert "WHERE" in sql
        assert "email" not in sql
        assert "display_name" not in sql


def test_seed_plan_unchanged_by_reset_feature(plan):
    # Adding reset must not alter the deterministic seed dataset.
    assert len(plan.loops) == 2
    assert len(plan.matches) == 8
    assert len(plan.applications) == 2
