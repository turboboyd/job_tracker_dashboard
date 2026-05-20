from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import UUID, uuid4

import pytest

from app.db.models.application import Application
from app.db.models.vacancy_match import VacancyMatch
from app.modules.vacancy_matches.schemas import VacancyMatchFromPreviewRequest
from app.modules.vacancy_matches.service import (
    VacancyMatchPreviewValidationError,
    VacancyMatchesService,
)

USER_ID = uuid4()
LOOP_ID = str(uuid4())
SOURCE_ID = "arbeitnow"


def make_user():
    from app.db.models.user import User

    return User(
        id=USER_ID,
        firebase_uid="firebase-test",
        email="test@example.com",
        display_name="Test User",
        photo_url=None,
    )


def make_loop():
    return SimpleNamespace(id=LOOP_ID, user_id=USER_ID, status="active")


def make_source(source_id: str = SOURCE_ID, enabled: bool = True):
    from app.modules.discovery_sources.schemas import DiscoverySource

    return DiscoverySource(
        id=source_id,
        name="Arbeitnow",
        type="job_board",
        enabled=enabled,
        description="Test source.",
        countries=["DE"],
        base_url="https://www.arbeitnow.com/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": True,
            "requires_credentials": False,
            "supports_filters": True,
        },
    )


def make_preview_request(**overrides) -> VacancyMatchFromPreviewRequest:
    data = {
        "source_id": SOURCE_ID,
        "external_id": "job-123",
        "source_url": "https://www.arbeitnow.com/jobs/acme/engineer-123",
        "title": "Backend Engineer",
        "company": "Acme GmbH",
        "location": "Berlin",
        "description": "Python role.",
    }
    data.update(overrides)
    return VacancyMatchFromPreviewRequest(**data)


def make_application(app_id: UUID | None = None) -> Application:
    app = Application()
    app.id = app_id or uuid4()
    app.user_id = USER_ID
    app.loop_id = LOOP_ID
    app.company_name = "Acme GmbH"
    app.role_title = "Backend Engineer"
    app.status = "SAVED"
    app.has_loop = True
    return app


def make_match(
    match_id: UUID | None = None,
    application_id: UUID | None = None,
    status: str = "converted",
) -> VacancyMatch:
    match = VacancyMatch()
    match.id = match_id or uuid4()
    match.user_id = USER_ID
    match.loop_id = LOOP_ID
    match.source = SOURCE_ID
    match.external_id = "job-123"
    match.source_url = "https://www.arbeitnow.com/jobs/acme/engineer-123"
    match.status = status
    match.application_id = application_id
    return match


def make_service(db=None) -> VacancyMatchesService:
    db = db or MagicMock()
    svc = VacancyMatchesService(db)
    svc._loops = AsyncMock()
    svc._loops.require_owned_active = AsyncMock(return_value=make_loop())
    svc._repo = AsyncMock()
    svc._apps = AsyncMock()
    svc._apps_repo = AsyncMock()
    return svc


# ── source validation ──────────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_unknown_source_raises_validation_error():
    svc = make_service()
    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=None,
    ):
        with pytest.raises(VacancyMatchPreviewValidationError, match="not registered"):
            await svc.save_preview_as_application(
                make_user(), LOOP_ID, make_preview_request()
            )


@pytest.mark.asyncio
async def test_disabled_source_raises_validation_error():
    svc = make_service()
    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(enabled=False),
    ):
        with pytest.raises(VacancyMatchPreviewValidationError, match="disabled"):
            await svc.save_preview_as_application(
                make_user(), LOOP_ID, make_preview_request()
            )


# ── dedup level 1: external_id ─────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dedup_by_external_id_returns_existing_app():
    app = make_application()
    match = make_match(application_id=app.id)

    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=match)
    svc._apps_repo.get_by_id = AsyncMock(return_value=app)

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        result_app, result_match, created, duplicate = (
            await svc.save_preview_as_application(
                make_user(), LOOP_ID, make_preview_request()
            )
        )

    assert duplicate is True
    assert created is False
    assert result_app.id == app.id
    svc._apps.create.assert_not_called()


@pytest.mark.asyncio
async def test_dedup_by_external_id_match_without_app_creates_application():
    match = make_match(application_id=None, status="saved")
    app = make_application()

    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=match)
    svc._apps.create = AsyncMock(return_value=app)
    svc._repo.patch = AsyncMock(return_value=match)

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        result_app, result_match, created, duplicate = (
            await svc.save_preview_as_application(
                make_user(), LOOP_ID, make_preview_request()
            )
        )

    assert created is True
    assert duplicate is False
    svc._apps.create.assert_called_once()
    svc._repo.patch.assert_called_once()


# ── dedup level 2: source_url ──────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_dedup_by_url_returns_existing_app():
    app = make_application()
    match = make_match(application_id=app.id)
    match.source_url = "https://www.arbeitnow.com/jobs/acme/engineer-123"

    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=None)
    svc._repo.list_for_source = AsyncMock(return_value=[match])
    svc._apps_repo.get_by_id = AsyncMock(return_value=app)

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        result_app, _, created, duplicate = await svc.save_preview_as_application(
            make_user(), LOOP_ID, make_preview_request(external_id=None)
        )

    assert duplicate is True
    assert created is False
    assert result_app.id == app.id
    svc._apps.create.assert_not_called()


# ── no duplicate: creates application and match ────────────────────────────────


@pytest.mark.asyncio
async def test_no_duplicate_creates_application_and_match():
    app = make_application()
    match = make_match()

    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=None)
    svc._repo.list_for_source = AsyncMock(return_value=[])
    svc._apps.create = AsyncMock(return_value=app)
    svc._repo.create = AsyncMock(return_value=match)

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        result_app, result_match, created, duplicate = (
            await svc.save_preview_as_application(
                make_user(), LOOP_ID, make_preview_request()
            )
        )

    assert created is True
    assert duplicate is False
    svc._apps.create.assert_called_once()
    svc._repo.create.assert_called_once()
    created_match_arg = svc._repo.create.call_args[0][0]
    assert created_match_arg.status == "converted"
    assert created_match_arg.application_id == app.id


# ── application defaults ───────────────────────────────────────────────────────


@pytest.mark.asyncio
async def test_application_has_status_saved():
    app = make_application()
    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=None)
    svc._repo.list_for_source = AsyncMock(return_value=[])
    svc._apps.create = AsyncMock(return_value=app)
    svc._repo.create = AsyncMock(return_value=make_match())

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        await svc.save_preview_as_application(
            make_user(), LOOP_ID, make_preview_request()
        )

    call_args = svc._apps.create.call_args
    app_create = call_args[0][1]
    assert app_create.status == "SAVED"
    assert app_create.has_loop is True
    assert app_create.loop_id == LOOP_ID


@pytest.mark.asyncio
async def test_missing_company_uses_fallback():
    app = make_application()
    svc = make_service()
    svc._repo.get_by_source_external_id = AsyncMock(return_value=None)
    svc._repo.list_for_source = AsyncMock(return_value=[])
    svc._apps.create = AsyncMock(return_value=app)
    svc._repo.create = AsyncMock(return_value=make_match())

    with patch(
        "app.modules.vacancy_matches.service.get_discovery_source",
        return_value=make_source(),
    ):
        await svc.save_preview_as_application(
            make_user(), LOOP_ID, make_preview_request(company=None)
        )

    app_create = svc._apps.create.call_args[0][1]
    assert app_create.company_name == "Компания не указана"
