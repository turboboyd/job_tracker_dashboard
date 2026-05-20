from __future__ import annotations

from dataclasses import dataclass, field
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.discovery_preview.router import get_discovery_preview_service
from app.modules.discovery_preview.schemas import DiscoveryPreviewRequest
from app.modules.discovery_preview.service import (
    DiscoveryPreviewError,
    DiscoveryPreviewService,
)
from app.modules.loops.service import InvalidLoopError
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse

USER_ID = uuid4()
LOOP_ID = "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0"


def make_user(user_id: UUID = USER_ID) -> User:
    return User(
        id=user_id,
        firebase_uid=f"firebase-{user_id}",
        email="user@example.com",
        display_name="User",
        photo_url=None,
    )


async def current_user() -> User:
    return make_user()


@dataclass
class FakeLoopsService:
    calls: list[str] = field(default_factory=list)

    async def require_owned_active(self, user: User, loop_id: str):
        self.calls.append(loop_id)
        if loop_id == "not-a-uuid":
            raise InvalidLoopError("Loop id must be a valid UUID")
        return object()


@dataclass
class FakeVacancyImportService:
    calls: list[str] = field(default_factory=list)

    async def preview(self, url: str) -> VacancyImportPreviewResponse:
        self.calls.append(url)
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


def make_service(
    loops: FakeLoopsService | None = None,
    import_service: FakeVacancyImportService | None = None,
) -> DiscoveryPreviewService:
    return DiscoveryPreviewService(
        loops or FakeLoopsService(),
        import_service or FakeVacancyImportService(),
    )


def test_discovery_preview_endpoint_returns_structured_manual_preview() -> None:
    service = make_service()
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_discovery_preview_service] = lambda: service

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/discovery-preview",
            json={
                "loop_id": LOOP_ID,
                "source_id": "manual_url",
                "url": "https://example.com/jobs/frontend",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["loop_id"] == LOOP_ID
    assert data["source_id"] == "manual_url"
    assert data["status"] == "ready"
    assert data["normalized_url"] == "https://example.com/jobs/frontend"
    assert data["title"] == "Frontend Developer"
    assert data["company"] == "Acme GmbH"
    assert data["can_create_match"] is True
    assert data["match"] == {
        "loop_id": LOOP_ID,
        "source_id": "manual_url",
        "source_url": "https://example.com/jobs/frontend",
        "source": "example.com",
        "company_name": "Acme GmbH",
        "role_title": "Frontend Developer",
        "location_text": "Berlin",
        "vacancy_description": "Build UI.",
        "confidence": {"role_title": 0.9},
        "warnings": [],
        "status": "saved",
    }
    removed = "cy" + "cle"
    assert removed not in response.text


@pytest.mark.asyncio
async def test_discovery_preview_validates_unknown_source_id() -> None:
    with pytest.raises(DiscoveryPreviewError) as exc:
        await make_service().preview(
            make_user(),
            DiscoveryPreviewRequest(
                loop_id=LOOP_ID,
                source_id="unknown_source",
                url="https://example.com/jobs/frontend",
            ),
        )

    assert exc.value.code == "UNKNOWN_DISCOVERY_SOURCE"
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_discovery_preview_rejects_source_without_manual_preview() -> None:
    with pytest.raises(DiscoveryPreviewError) as exc:
        await make_service().preview(
            make_user(),
            DiscoveryPreviewRequest(
                loop_id=LOOP_ID,
                source_id="stepstone",
                url="https://example.com/jobs/frontend",
            ),
        )

    assert exc.value.code == "DISCOVERY_SOURCE_MANUAL_PREVIEW_UNSUPPORTED"
    assert exc.value.status_code == 400


@pytest.mark.asyncio
async def test_discovery_preview_requires_valid_loop() -> None:
    with pytest.raises(InvalidLoopError) as exc:
        await make_service().preview(
            make_user(),
            DiscoveryPreviewRequest(
                loop_id="not-a-uuid",
                source_id="manual_url",
                url="https://example.com/jobs/frontend",
            ),
        )

    assert exc.value.code == "INVALID_LOOP"
    assert exc.value.status_code == 422


def test_discovery_preview_requires_loop_id_field() -> None:
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_discovery_preview_service] = lambda: make_service()

    with TestClient(app) as client:
        response = client.post(
            "/api/v1/discovery-preview",
            json={
                "source_id": "manual_url",
                "url": "https://example.com/jobs/frontend",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422


@pytest.mark.asyncio
async def test_discovery_preview_does_not_create_match_by_default() -> None:
    loops = FakeLoopsService()
    import_service = FakeVacancyImportService()
    service = make_service(loops, import_service)

    response = await service.preview(
        make_user(),
        DiscoveryPreviewRequest(
            loop_id=LOOP_ID,
            source_id="manual_url",
            url="https://example.com/jobs/frontend",
        ),
    )

    assert loops.calls == [LOOP_ID]
    assert import_service.calls == ["https://example.com/jobs/frontend"]
    assert response.match.status == "saved"
    assert response.can_create_match is True
