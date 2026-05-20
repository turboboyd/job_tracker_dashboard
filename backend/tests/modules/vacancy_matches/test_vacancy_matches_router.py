from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.vacancy_import.schemas import VacancyImportPreviewResponse
from app.modules.vacancy_matches.schemas import VacancyMatchEvaluationResponse
from app.modules.vacancy_matches.router import get_vacancy_matches_service
from app.modules.vacancy_matches.service import (
    VacancyMatchConvertValidationError,
    VacancyMatchNotFoundError,
)

USER_ID = uuid4()
OTHER_USER_ID = uuid4()
APP_ID = uuid4()
MATCH_ID = uuid4()
NOW = datetime(2026, 5, 13, tzinfo=UTC)


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


def make_match(**overrides):
    data = {
        "id": MATCH_ID,
        "user_id": USER_ID,
        "loop_id": "loop-1",
        "source_url": "https://example.com/jobs/frontend",
        "source": "example.com",
        "external_id": None,
        "company_name": "Acme GmbH",
        "role_title": "Frontend Developer",
        "location_text": "Berlin",
        "vacancy_description": "Build UI.",
        "raw_metadata": {},
        "confidence": {"role_title": 0.9},
        "warnings": [],
        "status": "saved",
        "application_id": None,
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_preview_ignore(**overrides):
    data = {
        "id": uuid4(),
        "user_id": USER_ID,
        "loop_id": "loop-1",
        "source_id": "arbeitsagentur",
        "external_id": "job-1",
        "source_url": "https://example.com/jobs/frontend",
        "title": "Frontend Developer",
        "company": "Acme GmbH",
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_application(**overrides):
    data = {
        "id": APP_ID,
        "user_id": USER_ID,
        "archived": False,
        "is_favorite": False,
        "company_name": "Acme GmbH",
        "role_title": "Frontend Developer",
        "location_text": "Berlin",
        "vacancy_url": "https://example.com/jobs/frontend",
        "source": "example.com",
        "employment_type": None,
        "work_mode": None,
        "salary": None,
        "posted_at": None,
        "status": "SAVED",
        "stage": "ACTIVE",
        "sub_status": None,
        "last_status_change_at": NOW,
        "applied_at": None,
        "applied_via": None,
        "next_action_at": None,
        "next_action_text": None,
        "contact_attempts": 0,
        "last_contact_at": None,
        "last_follow_up_at": None,
        "follow_up_level": 0,
        "needs_follow_up": False,
        "follow_up_due_at": None,
        "needs_reapply_suggestion": False,
        "reapply_eligible_at": None,
        "reapply_reason": None,
        "reminders": None,
        "current_note": None,
        "tags": None,
        "vacancy_description": "Build UI.",
        "role_fingerprint": None,
        "loop_id": "loop-1",
        "has_loop": True,
        "cv_version_id": None,
        "profile_version_id": None,
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


@dataclass
class FakeVacancyMatchesService:
    matches: list = field(default_factory=lambda: [make_match()])
    preview_ignores: list = field(default_factory=list)
    preview_calls: int = 0
    create_calls: int = 0
    ignore_calls: int = 0
    convert_missing_required: bool = False

    async def import_preview(
        self,
        user: User,
        loop_id: str,
        url: str,
    ) -> VacancyImportPreviewResponse:
        self.preview_calls += 1
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

    async def create(self, user: User, loop_id: str, payload):
        self.create_calls += 1
        match = make_match(
            id=uuid4(),
            user_id=user.id,
            loop_id=loop_id,
            source_url=payload.source_url,
            source=payload.source,
            external_id=payload.external_id,
            company_name=payload.company_name,
            role_title=payload.role_title,
            raw_metadata=payload.raw_metadata,
            status=payload.status,
        )
        self.matches.append(match)
        return match

    async def create_from_preview(self, user: User, loop_id: str, payload):
        self.create_calls += 1
        for match in self.matches:
            if (
                match.user_id == user.id
                and match.loop_id == loop_id
                and match.source == payload.source_id
                and match.external_id
                and match.external_id == payload.external_id
            ):
                return match, False
        match = make_match(
            id=uuid4(),
            user_id=user.id,
            loop_id=loop_id,
            source_url=payload.source_url,
            source=payload.source_id,
            external_id=payload.external_id,
            company_name=payload.company,
            role_title=payload.title,
            location_text=payload.location,
            vacancy_description=payload.description,
            raw_metadata=payload.raw_metadata,
            status="saved",
        )
        self.matches.append(match)
        return match, True

    async def create_preview_ignore(self, user: User, loop_id: str, payload):
        self.ignore_calls += 1
        for item in self.preview_ignores:
            if (
                item.user_id == user.id
                and item.loop_id == loop_id
                and item.source_id == payload.source_id
                and item.external_id
                and item.external_id == payload.external_id
            ):
                return item, False
        item = make_preview_ignore(
            user_id=user.id,
            loop_id=loop_id,
            source_id=payload.source_id,
            external_id=payload.external_id,
            source_url=payload.source_url,
            title=payload.title,
            company=payload.company,
        )
        self.preview_ignores.append(item)
        return item, True

    async def list_preview_ignores_for_loop(
        self,
        user: User,
        loop_id: str,
        *,
        limit=200,
        offset=0,
    ):
        items = [
            item
            for item in self.preview_ignores
            if item.user_id == user.id and item.loop_id == loop_id
        ]
        return items[offset : offset + limit], len(items)

    async def delete_preview_ignore(self, user: User, loop_id: str, ignore_id: UUID):
        for item in self.preview_ignores:
            if item.id == ignore_id and item.user_id == user.id and item.loop_id == loop_id:
                self.preview_ignores = [
                    existing for existing in self.preview_ignores if existing.id != ignore_id
                ]
                return None
        raise VacancyMatchNotFoundError("Preview ignore not found")

    async def list_for_loop(
        self,
        user: User,
        loop_id: str,
        *,
        status=None,
        limit=20,
        offset=0,
    ):
        items = [
            item
            for item in self.matches
            if item.user_id == user.id and item.loop_id == loop_id
        ]
        if status:
            items = [item for item in items if item.status == status]
        return items[offset : offset + limit], len(items)

    async def patch(self, user: User, loop_id: str, match_id: UUID, payload):
        for item in self.matches:
            if (
                item.id == match_id
                and item.user_id == user.id
                and item.loop_id == loop_id
            ):
                updates = payload.model_dump(exclude_unset=True, exclude_none=True)
                for key, value in updates.items():
                    setattr(item, key, value)
                return item
        raise VacancyMatchNotFoundError("Vacancy match not found")

    async def evaluate(self, user: User, loop_id: str, match_id: UUID):
        for item in self.matches:
            if (
                item.id == match_id
                and item.user_id == user.id
                and item.loop_id == loop_id
            ):
                return VacancyMatchEvaluationResponse(
                    match_id=match_id,
                    loop_id=loop_id,
                    total_score=72,
                    title_match_score=25,
                    location_match_score=10,
                    employment_type_match_score=0,
                    work_mode_match_score=0,
                    keyword_score=20,
                    excluded_keyword_penalty=0,
                    source_score=15,
                    reasons=["Matched keyword: Python."],
                    penalties=[],
                    duplicate_status="none",
                    duplicate_of_match_id=None,
                    duplicate_application_id=None,
                    duplicate_reasons=[],
                )
        raise VacancyMatchNotFoundError("Vacancy match not found")

    async def convert_to_application(self, user: User, loop_id: str, match_id: UUID):
        if self.convert_missing_required:
            raise VacancyMatchConvertValidationError(
                "company_name and role_title are required for conversion"
            )
        match = await self.patch(
            user,
            loop_id,
            match_id,
            SimpleNamespace(model_dump=lambda **_: {"status": "converted"}),
        )
        match.application_id = APP_ID
        app = SimpleNamespace(id=APP_ID)
        return app, match

    async def create_application_from_match(self, user: User, loop_id: str, match_id: UUID, payload):
        if self.convert_missing_required:
            raise VacancyMatchConvertValidationError(
                "company_name and role_title are required for conversion"
            )
        for item in self.matches:
            if item.id == match_id and item.user_id == user.id and item.loop_id == loop_id:
                if item.application_id:
                    return make_application(id=item.application_id), item, False, True
                item.status = "converted"
                item.application_id = APP_ID
                app = make_application(
                    id=APP_ID,
                    company_name=item.company_name,
                    role_title=item.role_title,
                    location_text=item.location_text,
                    vacancy_url=item.source_url,
                    source=item.source,
                    vacancy_description=item.vacancy_description,
                    loop_id=item.loop_id,
                    status=payload.status,
                    is_favorite=payload.favorite,
                    current_note=payload.notes,
                )
                return app, item, True, False
        raise VacancyMatchNotFoundError("Vacancy match not found")


def make_client(service: FakeVacancyMatchesService) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_vacancy_matches_service] = lambda: service
    return TestClient(app)


def test_import_preview_does_not_create_match() -> None:
    service = FakeVacancyMatchesService(matches=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches/import-preview",
            json={"url": "https://example.com/jobs/frontend"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json()["role_title"] == "Frontend Developer"
    assert service.preview_calls == 1
    assert service.create_calls == 0
    assert service.matches == []


def test_create_match_under_loop() -> None:
    service = FakeVacancyMatchesService(matches=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches",
            json={
                "source_url": "https://example.com/jobs/frontend",
                "company_name": "Acme GmbH",
                "role_title": "Frontend Developer",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["loop_id"] == "loop-1"
    assert data["status"] == "saved"
    assert service.create_calls == 1


def test_create_match_from_preview() -> None:
    service = FakeVacancyMatchesService(matches=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches/from-preview",
            json={
                "source_id": "arbeitsagentur",
                "external_id": "job-1",
                "source_url": "https://example.com/jobs/frontend",
                "title": "Frontend Developer",
                "company": "Acme GmbH",
                "location": "Berlin",
                "description": "Build UI.",
                "raw_metadata": {"refnr": "job-1"},
                "confidence": {"source_quality": 0.9},
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] is True
    assert data["duplicate"] is False
    assert data["match"]["loop_id"] == "loop-1"
    assert data["match"]["source"] == "arbeitsagentur"
    assert data["match"]["external_id"] == "job-1"
    assert data["match"]["application_id"] is None


def test_create_match_from_preview_duplicate_returns_existing() -> None:
    existing = make_match(source="arbeitsagentur", external_id="job-1")
    service = FakeVacancyMatchesService(matches=[existing])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches/from-preview",
            json={
                "source_id": "arbeitsagentur",
                "external_id": "job-1",
                "source_url": "https://example.com/jobs/frontend",
                "title": "Frontend Developer",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] is False
    assert data["duplicate"] is True
    assert data["match"]["id"] == str(existing.id)


def test_create_preview_ignore_does_not_create_match() -> None:
    service = FakeVacancyMatchesService(matches=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches/preview-ignores",
            json={
                "source_id": "arbeitsagentur",
                "external_id": "job-1",
                "source_url": "https://example.com/jobs/frontend",
                "title": "Frontend Developer",
                "company": "Acme GmbH",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] is True
    assert data["duplicate"] is False
    assert data["item"]["loop_id"] == "loop-1"
    assert data["item"]["source_id"] == "arbeitsagentur"
    assert service.ignore_calls == 1
    assert service.create_calls == 0
    assert service.matches == []


def test_create_preview_ignore_duplicate_returns_existing() -> None:
    existing = make_preview_ignore()
    service = FakeVacancyMatchesService(matches=[], preview_ignores=[existing])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops/loop-1/matches/preview-ignores",
            json={
                "source_id": "arbeitsagentur",
                "external_id": "job-1",
                "source_url": "https://example.com/jobs/frontend",
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    data = response.json()
    assert data["created"] is False
    assert data["duplicate"] is True
    assert data["item"]["id"] == str(existing.id)


def test_list_preview_ignores_scoped_to_current_user() -> None:
    service = FakeVacancyMatchesService(
        matches=[],
        preview_ignores=[
            make_preview_ignore(),
            make_preview_ignore(id=uuid4(), user_id=OTHER_USER_ID),
        ],
    )
    with make_client(service) as client:
        response = client.get(
            "/api/v1/loops/loop-1/matches/preview-ignores",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["source_id"] == "arbeitsagentur"


def test_delete_preview_ignore_removes_item() -> None:
    existing = make_preview_ignore()
    service = FakeVacancyMatchesService(matches=[], preview_ignores=[existing])
    with make_client(service) as client:
        response = client.delete(
            f"/api/v1/loops/loop-1/matches/preview-ignores/{existing.id}",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 204
    assert service.preview_ignores == []


def test_delete_preview_ignore_unknown_id_returns_404() -> None:
    service = FakeVacancyMatchesService(matches=[], preview_ignores=[])
    with make_client(service) as client:
        response = client.delete(
            f"/api/v1/loops/loop-1/matches/preview-ignores/{uuid4()}",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 404


def test_list_matches_scoped_to_current_user_and_status() -> None:
    service = FakeVacancyMatchesService(
        matches=[
            make_match(id=uuid4(), status="saved"),
            make_match(id=uuid4(), status="ignored"),
            make_match(id=uuid4(), user_id=OTHER_USER_ID, status="saved"),
        ]
    )
    with make_client(service) as client:
        response = client.get(
            "/api/v1/loops/loop-1/matches?status=saved",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 1
    assert data["items"][0]["status"] == "saved"


def test_patch_match() -> None:
    service = FakeVacancyMatchesService()
    with make_client(service) as client:
        response = client.patch(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}",
            json={"status": "ignored", "role_title": "Backend Developer"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ignored"
    assert data["role_title"] == "Backend Developer"


def test_convert_match_to_application() -> None:
    service = FakeVacancyMatchesService()
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/convert-to-application",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["application_id"] == str(APP_ID)
    assert data["match"]["status"] == "converted"
    assert data["match"]["application_id"] == str(APP_ID)


def test_create_application_from_match_returns_application_and_updated_match() -> None:
    service = FakeVacancyMatchesService()
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/create-application",
            json={"status": "SAVED", "notes": "Follow up", "favorite": True},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["created"] is True
    assert data["already_linked"] is False
    assert data["application"]["id"] == str(APP_ID)
    assert data["application"]["company_name"] == "Acme GmbH"
    assert data["application"]["role_title"] == "Frontend Developer"
    assert data["application"]["loop_id"] == "loop-1"
    assert data["application"]["current_note"] == "Follow up"
    assert data["application"]["is_favorite"] is True
    assert data["match"]["status"] == "converted"
    assert data["match"]["application_id"] == str(APP_ID)


def test_create_application_from_match_already_linked_returns_existing() -> None:
    service = FakeVacancyMatchesService(matches=[make_match(application_id=APP_ID, status="converted")])
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/create-application",
            json={},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["created"] is False
    assert data["already_linked"] is True
    assert data["application"]["id"] == str(APP_ID)
    assert data["match"]["application_id"] == str(APP_ID)


def test_evaluate_match_returns_score_and_duplicate_metadata() -> None:
    service = FakeVacancyMatchesService()
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/evaluate",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["match_id"] == str(MATCH_ID)
    assert data["loop_id"] == "loop-1"
    assert data["total_score"] == 72
    assert data["reasons"] == ["Matched keyword: Python."]
    assert data["duplicate_status"] == "none"
    removed = "cy" + "cle"
    assert removed not in response.text


def test_evaluate_match_unknown_match_returns_404() -> None:
    service = FakeVacancyMatchesService(matches=[])
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/evaluate",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 404
    body = response.json()
    assert body["error"]["message"]["code"] == "VACANCY_MATCH_NOT_FOUND"


def test_cannot_convert_without_company_or_role() -> None:
    service = FakeVacancyMatchesService(convert_missing_required=True)
    with make_client(service) as client:
        response = client.post(
            f"/api/v1/loops/loop-1/matches/{MATCH_ID}/convert-to-application",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["message"]["code"] == "VACANCY_MATCH_CONVERT_INVALID"
