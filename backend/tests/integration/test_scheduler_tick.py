"""Integration tests for the background discovery scheduler tick.

Exercises `app.scheduler.scheduler_tick` against the real test database. The
expensive/networked `DiscoveryRunsService.run` is monkeypatched so we only
assert on the *scheduling contract*: which loops are picked up, what payload
they run with (dry vs. real), and that `next_run_at` is advanced.

The key behaviour under test: only ACTIVE loops with auto-discovery ENABLED and
a due `next_run_at` are warmed. Loops with auto-discovery disabled, inactive
loops, and loops whose `next_run_at` is still in the future are never warmed.
"""
from __future__ import annotations

from datetime import UTC, datetime, timedelta

import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

pytestmark = pytest.mark.asyncio(loop_scope="session")

from app import scheduler as scheduler_module
from app.db.models.loop import Loop
from app.db.models.user import User
from app.modules.discovery_runs.service import DiscoveryRunsService


@pytest_asyncio.fixture
def session_factory(test_engine, setup_schema):
    """An async_sessionmaker the scheduler can open its own sessions from."""
    return async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def _make_loop(
    session_factory: async_sessionmaker[AsyncSession],
    *,
    firebase_uid: str,
    auto_discovery_enabled: bool,
    selected_sources: list[str],
    discovery_interval_hours: int = 24,
    status: str = "active",
    next_run_at: datetime | None = None,
) -> tuple:
    """Create a user + loop, return (user_id, loop_id).

    Defaults to an active loop that is due immediately (next_run_at is null).
    """
    async with session_factory() as db:
        user = User(firebase_uid=firebase_uid, email=f"{firebase_uid}@example.com")
        db.add(user)
        await db.flush()
        loop = Loop(
            user_id=user.id,
            title="Scheduler Loop",
            status=status,
            auto_discovery_enabled=auto_discovery_enabled,
            discovery_interval_hours=discovery_interval_hours,
            selected_sources=selected_sources,
            next_run_at=next_run_at,
        )
        db.add(loop)
        await db.commit()
        return user.id, loop.id


def _capture_runs(monkeypatch) -> list:
    captured: list = []

    async def fake_run(self, *, user, payload):  # noqa: ANN001
        captured.append(payload)
        return None

    monkeypatch.setattr(DiscoveryRunsService, "run", fake_run)
    return captured


async def test_scheduler_runs_due_auto_discovery_loop(session_factory, monkeypatch):
    """active + auto_discovery_enabled=True + due → selected, real (non-dry) pass."""
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-auto-due",
        auto_discovery_enabled=True,
        selected_sources=["arbeitnow"],
    )

    captured = _capture_runs(monkeypatch)

    await scheduler_module.scheduler_tick(session_factory)

    mine = [p for p in captured if p.loop_id == str(loop_id)]
    assert len(mine) == 1, "the due auto-discovery loop should run exactly once"
    assert mine[0].dry_run is False, "auto-discovery loops must persist matches"

    async with session_factory() as db:
        refreshed = await db.get(Loop, loop_id)
        assert refreshed is not None
        assert refreshed.next_run_at is not None
        assert refreshed.next_run_at > datetime.now(UTC)


async def test_scheduler_skips_non_auto_loop(session_factory, monkeypatch):
    """active + auto_discovery_enabled=False + due → NOT selected.

    This is the regression guard for the dev-QA seed loops: with auto-discovery
    off, the scheduler must never repopulate them with new matches.
    """
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-nonauto",
        auto_discovery_enabled=False,
        selected_sources=["arbeitnow"],
    )

    captured = _capture_runs(monkeypatch)

    await scheduler_module.scheduler_tick(session_factory)

    assert all(p.loop_id != str(loop_id) for p in captured), (
        "a loop with auto-discovery disabled must never be warmed"
    )

    async with session_factory() as db:
        refreshed = await db.get(Loop, loop_id)
        assert refreshed is not None
        # Never selected → next_run_at left untouched (still null).
        assert refreshed.next_run_at is None


async def test_scheduler_skips_inactive_loop(session_factory, monkeypatch):
    """non-active status (even with auto-discovery on + due) → NOT selected."""
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-inactive",
        auto_discovery_enabled=True,
        selected_sources=["arbeitnow"],
        status="paused",
    )

    captured = _capture_runs(monkeypatch)

    await scheduler_module.scheduler_tick(session_factory)

    assert all(p.loop_id != str(loop_id) for p in captured), (
        "an inactive loop must never be warmed"
    )


async def test_scheduler_skips_non_due_loop(session_factory, monkeypatch):
    """active + auto-discovery on but next_run_at in the future → NOT selected."""
    future = datetime.now(UTC) + timedelta(hours=2)
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-notdue",
        auto_discovery_enabled=True,
        selected_sources=["arbeitnow"],
        next_run_at=future,
    )

    captured = _capture_runs(monkeypatch)

    await scheduler_module.scheduler_tick(session_factory)

    assert all(p.loop_id != str(loop_id) for p in captured), (
        "a loop whose next_run_at is in the future must not be warmed yet"
    )


async def test_scheduler_skips_loop_without_sources(session_factory, monkeypatch):
    """An auto-discovery loop with no selected sources is skipped.

    Uses auto_discovery_enabled=True so this isolates the sources filter rather
    than the auto-discovery gate.
    """
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-nosources",
        auto_discovery_enabled=True,
        selected_sources=[],
    )

    captured = _capture_runs(monkeypatch)

    await scheduler_module.scheduler_tick(session_factory)

    assert all(p.loop_id != str(loop_id) for p in captured), (
        "a sourceless loop should never be run"
    )
