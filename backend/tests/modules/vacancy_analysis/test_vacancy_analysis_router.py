from __future__ import annotations

from datetime import UTC, date, datetime
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.vacancy_analysis.router import get_vacancy_analysis_service
from app.modules.vacancy_analysis.schemas import (
    VacancyAnalysisListResponse,
    VacancyAnalysisQuota,
    VacancyAnalysisRead,
    VacancyAnalysisResponse,
)
from app.modules.vacancy_analysis.service import AnalysisQuotaExceededError

USER_ID = uuid4()
LOOP_ID = UUID("4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0")
MATCH_ID = uuid4()
ANALYSIS_ID = uuid4()


def make_user() -> User:
    return User(
        id=USER_ID,
        firebase_uid="firebase-user",
        email="user@example.com",
        display_name="User",
        photo_url=None,
    )


async def current_user() -> User:
    return make_user()


def make_analysis() -> VacancyAnalysisRead:
    return VacancyAnalysisRead(
        id=ANALYSIS_ID,
        loop_id=str(LOOP_ID),
        match_id=MATCH_ID,
        analysis_type="basic",
        provider="deterministic",
        model="deterministic-v1",
        plan="free",
        resume_hash="abc123",
        vacancy_snapshot={"role_title": "Backend Engineer"},
        overall_score=72,
        summary="Deterministic analysis.",
        strengths=["Python"],
        gaps=[],
        risks=[],
        recommended_cv_keywords=["fastapi"],
        application_angle="Lead with backend fit.",
        cover_letter_draft=None,
        interview_questions=[],
        model_info={"provider": "deterministic", "mode": "deterministic"},
        quota_day=date(2026, 5, 14),
        created_at=datetime.now(UTC),
    )


class FakeAnalysisService:
    def __init__(self, quota_error: bool = False) -> None:
        self.quota_error = quota_error
        self.created_payload = None

    async def create(self, user, loop_id, match_id, payload):
        if self.quota_error:
            raise AnalysisQuotaExceededError("Daily basic analysis quota exceeded")
        self.created_payload = payload
        analysis = make_analysis()
        return VacancyAnalysisResponse(
            **analysis.model_dump(),
            quota=VacancyAnalysisQuota(
                plan="free",
                basic_used=1,
                basic_limit=10,
                ai_used=0,
                ai_limit=1,
                day=date(2026, 5, 14),
            ),
        )

    async def list_for_match(self, user, loop_id, match_id, *, limit=20, offset=0):
        return VacancyAnalysisListResponse(
            items=[make_analysis()],
            total=1,
            limit=limit,
            offset=offset,
        )

    async def latest_for_match(self, user, loop_id, match_id):
        return make_analysis()


def make_client(service: FakeAnalysisService) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_vacancy_analysis_service] = lambda: service
    return TestClient(app)


def test_create_analysis_endpoint_returns_saved_analysis_and_quota() -> None:
    service = FakeAnalysisService()
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/{LOOP_ID}/matches/{MATCH_ID}/analyses",
            json={"analysis_type": "basic", "resume_text": "Python FastAPI"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["provider"] == "deterministic"
    assert data["quota"]["basic_used"] == 1
    assert service.created_payload.resume_text == "Python FastAPI"


def test_quota_error_returns_429() -> None:
    with make_client(FakeAnalysisService(quota_error=True)) as client:
        response = client.post(
            f"/api/v1/loops/{LOOP_ID}/matches/{MATCH_ID}/analyses",
            json={"analysis_type": "basic", "resume_text": "Python FastAPI"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 429
    body = response.json()
    assert body["error"]["code"] == "ANALYSIS_QUOTA_EXCEEDED"


def test_list_and_latest_analysis_endpoints() -> None:
    with make_client(FakeAnalysisService()) as client:
        list_response = client.get(
            f"/api/v1/loops/{LOOP_ID}/matches/{MATCH_ID}/analyses",
            headers={"Authorization": "Bearer test"},
        )
        latest_response = client.get(
            f"/api/v1/loops/{LOOP_ID}/matches/{MATCH_ID}/analyses/latest",
            headers={"Authorization": "Bearer test"},
        )

    assert list_response.status_code == 200
    assert list_response.json()["total"] == 1
    assert latest_response.status_code == 200
    assert latest_response.json()["id"] == str(ANALYSIS_ID)


def test_analysis_response_has_no_removed_relation_fields() -> None:
    with make_client(FakeAnalysisService()) as client:
        response = client.post(
            f"/api/v1/loops/{LOOP_ID}/matches/{MATCH_ID}/analyses",
            json={"analysis_type": "basic", "resume_text": "Python FastAPI"},
            headers={"Authorization": "Bearer test"},
        )

    removed = "cy" + "cle"
    assert removed not in response.text.lower()
