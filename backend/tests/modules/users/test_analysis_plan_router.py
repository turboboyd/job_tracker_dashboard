from __future__ import annotations

from datetime import datetime
from types import SimpleNamespace
from uuid import uuid4

from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.users.service import get_analysis_plan_for_user


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


def make_client(user: User) -> TestClient:
    app = create_app()

    async def current_user() -> User:
        return user

    app.dependency_overrides[get_current_user] = current_user
    return TestClient(app)


def test_get_current_analysis_plan_returns_free_limits() -> None:
    with make_client(make_user("free")) as client:
        response = client.get(
            "/api/v1/users/me/analysis-plan",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "free"
    assert data["limits"] == {"basic_daily_limit": 10, "ai_daily_limit": 1}
    assert data["features"]["cover_letter"] == "short_template"
    assert data["features"]["interview_questions"] is False
    assert data["features"]["cv_keywords"] is True
    assert data["features"]["priority"] == "normal"
    # Default test config runs the deterministic provider → AI is not available.
    assert data["ai_available"] is False


def test_ai_available_reflects_configured_provider() -> None:
    user = make_user("free")

    deterministic = get_analysis_plan_for_user(
        user, SimpleNamespace(AI_ANALYSIS_PROVIDER="deterministic")
    )
    ollama = get_analysis_plan_for_user(
        user, SimpleNamespace(AI_ANALYSIS_PROVIDER="ollama")
    )

    assert deterministic.ai_available is False
    assert ollama.ai_available is True


def test_get_current_analysis_plan_returns_premium_features() -> None:
    with make_client(make_user("premium")) as client:
        response = client.get(
            "/api/v1/users/me/analysis-plan",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["plan"] == "premium"
    assert data["limits"] == {"basic_daily_limit": 300, "ai_daily_limit": 100}
    assert data["features"]["cover_letter"] == "enabled"
    assert data["features"]["interview_questions"] is True
    assert data["features"]["multi_match_comparison"] is True
    assert data["features"]["priority"] == "high"


def test_invalid_user_plan_falls_back_to_free() -> None:
    with make_client(make_user("unexpected")) as client:
        response = client.get(
            "/api/v1/users/me/analysis-plan",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json()["plan"] == "free"
