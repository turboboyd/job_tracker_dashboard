from __future__ import annotations

from datetime import datetime
from uuid import uuid4

import pytest

from app.db.models.user import User
from app.modules.users.service import UsersService, get_analysis_plan_for_user


def make_user(plan: str = "free") -> User:
    return User(
        id=uuid4(),
        firebase_uid="firebase-user",
        email="user@example.test",
        display_name="User",
        photo_url=None,
        analysis_plan=plan,
        language="ru",
        timezone="Europe/Berlin",
        date_format="DD.MM.YYYY",
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )


class FakeRepo:
    def __init__(self) -> None:
        self.updated_plan = None

    async def set_analysis_plan(self, user: User, plan: str) -> User:
        self.updated_plan = plan
        user.analysis_plan = plan
        return user


@pytest.mark.parametrize(
    ("plan", "basic_limit", "ai_limit"),
    [
        ("free", 10, 1),
        ("basic", 100, 50),
        ("premium", 300, 100),
    ],
)
def test_get_analysis_plan_for_user_returns_policy(plan, basic_limit, ai_limit) -> None:
    response = get_analysis_plan_for_user(make_user(plan))

    assert response.plan == plan
    assert response.limits.basic_daily_limit == basic_limit
    assert response.limits.ai_daily_limit == ai_limit


def test_get_analysis_plan_for_user_falls_back_to_free_for_invalid_plan() -> None:
    response = get_analysis_plan_for_user(make_user("broken"))

    assert response.plan == "free"
    assert response.limits.basic_daily_limit == 10


@pytest.mark.asyncio
async def test_admin_service_hook_can_set_user_analysis_plan() -> None:
    service = UsersService(db=None)  # type: ignore[arg-type]
    repo = FakeRepo()
    service._repo = repo  # type: ignore[attr-defined]
    user = make_user("free")

    updated = await service.set_user_analysis_plan_for_admin(user, "basic")

    assert updated.analysis_plan == "basic"
    assert repo.updated_plan == "basic"
