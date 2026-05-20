from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.db.models.user import User
from app.db.models.vacancy_match import VacancyMatch
from app.modules.loops.service import LoopNotFoundError
from app.modules.vacancy_matches.schemas import CreateApplicationFromMatchRequest
from app.modules.vacancy_matches.service import (
    VacancyMatchConvertValidationError,
    VacancyMatchNotFoundError,
    VacancyMatchesService,
)


USER_ID = uuid4()
MATCH_ID = uuid4()
APP_ID = uuid4()


def make_user() -> User:
    return User(
        id=USER_ID,
        firebase_uid="firebase-user",
        email="user@example.com",
        display_name="User",
        photo_url=None,
    )


def make_match(**overrides) -> VacancyMatch:
    data = {
        "id": MATCH_ID,
        "user_id": USER_ID,
        "loop_id": "loop-1",
        "source_url": "https://example.com/job",
        "source": "arbeitsagentur",
        "company_name": "Acme GmbH",
        "role_title": "Backend Engineer",
        "location_text": "Berlin",
        "vacancy_description": "Build APIs.",
        "status": "saved",
        "application_id": None,
    }
    data.update(overrides)
    return VacancyMatch(**data)


def make_application(**overrides):
    data = {
        "id": APP_ID,
        "user_id": USER_ID,
        "company_name": "Acme GmbH",
        "role_title": "Backend Engineer",
        "location_text": "Berlin",
        "vacancy_url": "https://example.com/job",
        "source": "arbeitsagentur",
        "status": "SAVED",
        "loop_id": "loop-1",
        "has_loop": True,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


class FakeLoops:
    def __init__(self, *, missing: bool = False) -> None:
        self.missing = missing

    async def require_owned_active(self, user, loop_id):
        if self.missing:
            raise LoopNotFoundError()
        return SimpleNamespace(id=loop_id, user_id=user.id)


class FakeRepo:
    def __init__(self, match: VacancyMatch | None) -> None:
        self.match = match
        self.patch_calls = 0

    async def get_owned_in_loop(self, *, user_id, loop_id, match_id):
        if (
            self.match is not None
            and self.match.user_id == user_id
            and self.match.loop_id == loop_id
            and self.match.id == match_id
        ):
            return self.match
        return None

    async def patch(self, match, updates):
        self.patch_calls += 1
        for key, value in updates.items():
            setattr(match, key, value)
        return match


class FakeApps:
    def __init__(self) -> None:
        self.create_calls = 0
        self.payload = None

    async def create(self, user, payload):
        self.create_calls += 1
        self.payload = payload
        return make_application(
            id=APP_ID,
            company_name=payload.company_name,
            role_title=payload.role_title,
            location_text=payload.location_text,
            vacancy_url=payload.vacancy_url,
            source=payload.source,
            status=payload.status,
            loop_id=payload.loop_id,
            has_loop=payload.has_loop,
        )


class FakeAppsRepo:
    def __init__(self, existing=None) -> None:
        self.existing = existing

    async def get_by_id(self, app_id):
        if self.existing is not None and self.existing.id == app_id:
            return self.existing
        return None


def make_service(match: VacancyMatch | None, *, existing_app=None) -> tuple[VacancyMatchesService, FakeApps, FakeRepo]:
    service = VacancyMatchesService(SimpleNamespace())
    repo = FakeRepo(match)
    apps = FakeApps()
    service._repo = repo
    service._apps = apps
    service._apps_repo = FakeAppsRepo(existing_app)
    service._loops = FakeLoops()
    return service, apps, repo


@pytest.mark.asyncio
async def test_create_application_from_match_creates_and_links_application() -> None:
    match = make_match()
    service, apps, repo = make_service(match)

    app, updated, created, already_linked = await service.create_application_from_match(
        make_user(),
        "loop-1",
        MATCH_ID,
        CreateApplicationFromMatchRequest(notes="Follow up", favorite=True),
    )

    assert created is True
    assert already_linked is False
    assert app.company_name == "Acme GmbH"
    assert app.role_title == "Backend Engineer"
    assert app.loop_id == "loop-1"
    assert updated.application_id == APP_ID
    assert updated.status == "converted"
    assert apps.create_calls == 1
    assert repo.patch_calls == 1
    assert apps.payload.current_note == "Follow up"
    assert apps.payload.is_favorite is True


@pytest.mark.asyncio
async def test_create_application_from_match_returns_existing_without_duplicate() -> None:
    existing = make_application(id=APP_ID)
    match = make_match(application_id=APP_ID, status="converted")
    service, apps, repo = make_service(match, existing_app=existing)

    app, updated, created, already_linked = await service.create_application_from_match(
        make_user(),
        "loop-1",
        MATCH_ID,
        CreateApplicationFromMatchRequest(),
    )

    assert app.id == APP_ID
    assert updated.application_id == APP_ID
    assert created is False
    assert already_linked is True
    assert apps.create_calls == 0
    assert repo.patch_calls == 0


@pytest.mark.asyncio
async def test_create_application_from_match_unknown_match_is_404() -> None:
    service, _, _ = make_service(None)

    with pytest.raises(VacancyMatchNotFoundError):
        await service.create_application_from_match(
            make_user(),
            "loop-1",
            MATCH_ID,
            CreateApplicationFromMatchRequest(),
        )


@pytest.mark.asyncio
async def test_create_application_from_match_rejects_match_outside_loop() -> None:
    service, _, _ = make_service(make_match(loop_id="loop-2"))

    with pytest.raises(VacancyMatchNotFoundError):
        await service.create_application_from_match(
            make_user(),
            "loop-1",
            MATCH_ID,
            CreateApplicationFromMatchRequest(),
        )


@pytest.mark.asyncio
async def test_create_application_from_match_requires_company_and_role() -> None:
    service, _, _ = make_service(make_match(company_name=None))

    with pytest.raises(VacancyMatchConvertValidationError):
        await service.create_application_from_match(
            make_user(),
            "loop-1",
            MATCH_ID,
            CreateApplicationFromMatchRequest(),
        )
