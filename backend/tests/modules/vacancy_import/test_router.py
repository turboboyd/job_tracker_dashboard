from __future__ import annotations

from dataclasses import dataclass
from uuid import uuid4

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse
from app.modules.vacancy_import.service import get_vacancy_import_service


@dataclass
class FakeVacancyImportService:
    async def preview(self, url: str) -> VacancyImportPreviewResponse:
        return VacancyImportPreviewResponse(
            source_url=url,
            source="example.com",
            company_name="Acme GmbH",
            role_title="Frontend Developer",
            location_text="Berlin",
            vacancy_description="Build UI.",
            confidence={"role_title": 0.9},
            warnings=[],
        )


async def fake_current_user() -> User:
    return User(
        id=uuid4(),
        firebase_uid="firebase-user-1",
        email="user@example.com",
        display_name="User",
        photo_url=None,
    )


def test_vacancy_import_preview_endpoint_returns_preview_shape(client) -> None:
    app = create_app()
    app.dependency_overrides[get_current_user] = fake_current_user
    app.dependency_overrides[get_vacancy_import_service] = lambda: FakeVacancyImportService()

    from fastapi.testclient import TestClient

    with TestClient(app) as local_client:
        response = local_client.post(
            "/api/v1/vacancy-import/preview",
            json={"url": "https://example.com/jobs/frontend"},
            headers={"Authorization": "Bearer test-token"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data == {
        "source_url": "https://example.com/jobs/frontend",
        "source": "example.com",
        "company_name": "Acme GmbH",
        "role_title": "Frontend Developer",
        "location_text": "Berlin",
        "vacancy_description": "Build UI.",
        "confidence": {"role_title": 0.9},
        "warnings": [],
    }
