"""Integration tests for the background discovery scheduler tick.

Exercises `app.scheduler.scheduler_tick` against the real test database. The
expensive/networked `DiscoveryRunsService.run` is monkeypatched so we only
assert on the *scheduling contract*: which loops are picked up, what payload
they run with (dry vs. real), and that `next_run_at` is advanced.

The key behaviour under test (added for the "fresh matches several times a day"
feature): EVERY due active loop with sources runs a real, non-dry pass so its
freshly-found vacancies are persisted as matches — not just auto-discovery loops.
"""
from __future__ import annotations

from datetime import datetime, timezone

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
) -> tuple:
    """Create a user + active loop (due now), return (user_id, loop_id)."""
    async with session_factory() as db:
        user = User(firebase_uid=firebase_uid, email=f"{firebase_uid}@example.com")
        db.add(user)
        await db.flush()
        loop = Loop(
            user_id=user.id,
            title="Scheduler Loop",
            status="active",
            auto_discovery_enabled=auto_discovery_enabled,
            discovery_interval_hours=discovery_interval_hours,
            selected_sources=selected_sources,
            next_run_at=None,  # null → due immediately
        )
        db.add(loop)
        await db.commit()
        return user.id, loop.id


async def test_scheduler_runs_non_auto_loop_as_real_pass(session_factory, monkeypatch):
    """A plain active loop (auto_discovery off) must run dry_run=False now."""
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-nonauto",
        auto_discovery_enabled=False,
        selected_sources=["arbeitnow"],
    )

    captured: list = []

    async def fake_run(self, *, user, payload):  # noqa: ANN001
        captured.append(payload)
        return None

    monkeypatch.setattr(DiscoveryRunsService, "run", fake_run)

    await scheduler_module.scheduler_tick(session_factory)

    mine = [p for p in captured if p.loop_id == str(loop_id)]
    assert len(mine) == 1, "the non-auto loop should run exactly once"
    assert mine[0].dry_run is False, "non-auto loops must now persist matches"

    async with session_factory() as db:
        refreshed = await db.get(Loop, loop_id)
        assert refreshed is not None
        assert refreshed.next_run_at is not None
        assert refreshed.next_run_at > datetime.now(timezone.utc)


async def test_scheduler_skips_loop_without_sources(session_factory, monkeypatch):
    """A loop with no selected sources is not worth warming and is skipped."""
    _user_id, loop_id = await _make_loop(
        session_factory,
        firebase_uid="sched-nosources",
        auto_discovery_enabled=False,
        selected_sources=[],
    )

    captured: list = []

    async def fake_run(self, *, user, payload):  # noqa: ANN001
        captured.append(payload)
        return None

    monkeypatch.setattr(DiscoveryRunsService, "run", fake_run)

    await scheduler_module.scheduler_tick(session_factory)

    assert all(p.loop_id != str(loop_id) for p in captured), (
        "a sourceless loop should never be run"
    )
