from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.core.config import get_settings
from app.db.models.user import User
from app.main import create_app
from app.modules.dev_tools.router import get_dev_tools_service


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


class FakeDevToolsService:
    def __init__(self) -> None:
        self.updated_plan = None

    async def set_user_analysis_plan_for_admin(self, user: User, plan: str) -> User:
        self.updated_plan = plan
        user.analysis_plan = plan
        return user


def make_client(*, user: User | None = None, is_development: bool = True):
    app = create_app()
    service = FakeDevToolsService()

    if user is not None:
        async def current_user() -> User:
            return user

        app.dependency_overrides[get_current_user] = current_user

    app.dependency_overrides[get_settings] = lambda: SimpleNamespace(
        is_development=is_development,
    )
    app.dependency_overrides[get_dev_tools_service] = lambda: service
    return TestClient(app), service


def test_dev_endpoint_updates_current_user_plan_in_development() -> None:
    user = make_user("free")
    client, service = make_client(user=user, is_development=True)

    with client:
        response = client.patch(
            "/api/v1/dev/users/me/analysis-plan",
            json={"plan": "basic"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "plan": "basic",
        "message": "Analysis plan updated for development testing.",
    }
    assert user.analysis_plan == "basic"
    assert service.updated_plan == "basic"


def test_plan_endpoint_returns_updated_plan_after_dev_switch() -> None:
    user = make_user("free")
    client, _service = make_client(user=user, is_development=True)

    with client:
        update = client.patch(
            "/api/v1/dev/users/me/analysis-plan",
            json={"plan": "premium"},
            headers={"Authorization": "Bearer test"},
        )
        read = client.get(
            "/api/v1/users/me/analysis-plan",
            headers={"Authorization": "Bearer test"},
        )

    assert update.status_code == 200
    assert read.status_code == 200
    assert read.json()["plan"] == "premium"
    assert read.json()["limits"] == {
        "basic_daily_limit": 300,
        "ai_daily_limit": 100,
    }


def test_invalid_plan_returns_validation_error() -> None:
    client, _service = make_client(user=make_user(), is_development=True)

    with client:
        response = client.patch(
            "/api/v1/dev/users/me/analysis-plan",
            json={"plan": "enterprise"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422


def test_production_environment_blocks_dev_endpoint() -> None:
    user = make_user("free")
    client, service = make_client(user=user, is_development=False)

    with client:
        response = client.patch(
            "/api/v1/dev/users/me/analysis-plan",
            json={"plan": "basic"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 404
    assert user.analysis_plan == "free"
    assert service.updated_plan is None


def test_missing_auth_is_rejected() -> None:
    client, _service = make_client(user=None, is_development=True)

    with client:
        response = client.patch(
            "/api/v1/dev/users/me/analysis-plan",
            json={"plan": "basic"},
        )

    assert response.status_code == 401
