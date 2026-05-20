from __future__ import annotations

from types import SimpleNamespace
from uuid import uuid4

import pytest

from app.db.models.user import User
from app.modules.loops.service import LoopNotFoundError
from app.modules.vacancy_matches.schemas import VacancyMatchFromPreviewRequest
from app.modules.vacancy_matches.schemas import VacancyPreviewIgnoreRequest
from app.modules.vacancy_matches.service import (
    VacancyMatchNotFoundError,
    VacancyMatchPreviewValidationError,
    VacancyMatchesService,
)


USER_ID = uuid4()


def make_user() -> User:
    return User(
        id=USER_ID,
        firebase_uid="firebase-user",
        email="user@example.com",
        display_name="User",
        photo_url=None,
    )


def make_payload(**overrides) -> VacancyMatchFromPreviewRequest:
    data = {
        "source_id": "arbeitsagentur",
        "external_id": "ref-1",
        "source_url": "HTTPS://Example.com/jobs/123/?b=2&a=1#fragment",
        "title": "Backend Engineer",
        "company": "Acme GmbH",
        "location": "Berlin",
        "description": "Build APIs.",
        "raw_metadata": {"large": "x" * 900},
        "confidence": {"source_quality": 0.9},
    }
    data.update(overrides)
    return VacancyMatchFromPreviewRequest(**data)


class FakeLoops:
    def __init__(self, *, missing: bool = False) -> None:
        self.missing = missing

    async def require_owned_active(self, user, loop_id):
        if self.missing:
            raise LoopNotFoundError()
        return SimpleNamespace(id=loop_id, user_id=user.id)

    async def require_owned_for_read(self, user, loop_id):
        if self.missing:
            raise LoopNotFoundError()
        return SimpleNamespace(id=loop_id, user_id=user.id)


class FakeRepo:
    def __init__(self) -> None:
        self.items = []
        self.ignores = []

    async def get_by_source_external_id(self, *, user_id, loop_id, source, external_id):
        for item in self.items:
            if (
                item.user_id == user_id
                and item.loop_id == loop_id
                and item.source == source
                and item.external_id == external_id
            ):
                return item
        return None

    async def list_for_source(self, *, user_id, loop_id, source):
        return [
            item
            for item in self.items
            if item.user_id == user_id and item.loop_id == loop_id and item.source == source
        ]

    async def create(self, match):
        match.id = uuid4()
        self.items.append(match)
        return match

    async def get_preview_ignore_by_source_external_id(
        self,
        *,
        user_id,
        loop_id,
        source_id,
        external_id,
    ):
        for item in self.ignores:
            if (
                item.user_id == user_id
                and item.loop_id == loop_id
                and item.source_id == source_id
                and item.external_id == external_id
            ):
                return item
        return None

    async def get_preview_ignore_by_source_url(self, *, user_id, loop_id, source_id, source_url):
        for item in self.ignores:
            if (
                item.user_id == user_id
                and item.loop_id == loop_id
                and item.source_id == source_id
                and item.source_url == source_url
            ):
                return item
        return None

    async def create_preview_ignore(self, ignore):
        ignore.id = uuid4()
        self.ignores.append(ignore)
        return ignore

    async def list_preview_ignores_for_loop(self, *, user_id, loop_id, limit=200, offset=0):
        items = [
            item
            for item in self.ignores
            if item.user_id == user_id and item.loop_id == loop_id
        ]
        return items[offset : offset + limit], len(items)

    async def get_preview_ignore_owned_in_loop(self, *, user_id, loop_id, ignore_id):
        for item in self.ignores:
            if item.id == ignore_id and item.user_id == user_id and item.loop_id == loop_id:
                return item
        return None

    async def delete_preview_ignore(self, ignore):
        self.ignores = [item for item in self.ignores if item.id != ignore.id]


def make_service(repo: FakeRepo) -> VacancyMatchesService:
    service = VacancyMatchesService(SimpleNamespace())
    service._repo = repo
    service._loops = FakeLoops()
    return service


@pytest.mark.asyncio
async def test_create_from_preview_creates_match_without_application() -> None:
    repo = FakeRepo()
    service = make_service(repo)

    match, created = await service.create_from_preview(make_user(), "loop-1", make_payload())

    assert created is True
    assert match.source == "arbeitsagentur"
    assert match.external_id == "ref-1"
    assert match.source_url == "https://example.com/jobs/123?a=1&b=2"
    assert match.application_id is None
    assert match.raw_metadata["large"] == "x" * 500


@pytest.mark.asyncio
async def test_create_from_preview_accepts_safe_mvp_sources() -> None:
    for source_id in ["adzuna", "remotive", "greenhouse", "lever"]:
        repo = FakeRepo()
        service = make_service(repo)

        match, created = await service.create_from_preview(
            make_user(),
            "loop-1",
            make_payload(
                source_id=source_id,
                external_id=f"{source_id}-1",
                source_url=f"https://example.com/{source_id}/jobs/1",
            ),
        )

        assert created is True
        assert match.source == source_id
        assert match.application_id is None


@pytest.mark.asyncio
async def test_create_from_preview_dedups_by_external_id() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    existing, _ = await service.create_from_preview(user, "loop-1", make_payload())

    duplicate, created = await service.create_from_preview(
        user,
        "loop-1",
        make_payload(source_url="https://example.com/another"),
    )

    assert created is False
    assert duplicate.id == existing.id


@pytest.mark.asyncio
async def test_create_from_preview_dedups_by_normalized_source_url() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    existing, _ = await service.create_from_preview(
        user,
        "loop-1",
        make_payload(external_id=None, source_url="https://example.com/jobs/123?b=2&a=1"),
    )

    duplicate, created = await service.create_from_preview(
        user,
        "loop-1",
        make_payload(external_id="ref-2", source_url="https://EXAMPLE.com/jobs/123/?a=1&b=2#top"),
    )

    assert created is False
    assert duplicate.id == existing.id


@pytest.mark.asyncio
async def test_create_from_preview_rejects_unknown_source() -> None:
    service = make_service(FakeRepo())

    with pytest.raises(VacancyMatchPreviewValidationError):
        await service.create_from_preview(
            make_user(),
            "loop-1",
            make_payload(source_id="unknown_source"),
        )


@pytest.mark.asyncio
async def test_create_from_preview_rejects_invalid_url() -> None:
    service = make_service(FakeRepo())

    with pytest.raises(VacancyMatchPreviewValidationError):
        await service.create_from_preview(
            make_user(),
            "loop-1",
            make_payload(source_url="javascript:alert(1)"),
        )


@pytest.mark.asyncio
async def test_create_from_preview_unknown_loop_is_safe() -> None:
    service = make_service(FakeRepo())
    service._loops = FakeLoops(missing=True)

    with pytest.raises(LoopNotFoundError):
        await service.create_from_preview(make_user(), "missing-loop", make_payload())


@pytest.mark.asyncio
async def test_create_preview_ignore_persists_without_match_or_application() -> None:
    repo = FakeRepo()
    service = make_service(repo)

    ignore, created = await service.create_preview_ignore(
        make_user(),
        "loop-1",
        VacancyPreviewIgnoreRequest(
            source_id="arbeitsagentur",
            external_id="ref-1",
            source_url="HTTPS://Example.com/jobs/123/?b=2&a=1#fragment",
            title="Backend Engineer",
            company="Acme GmbH",
        ),
    )

    assert created is True
    assert ignore.source_id == "arbeitsagentur"
    assert ignore.external_id == "ref-1"
    assert ignore.source_url == "https://example.com/jobs/123?a=1&b=2"
    assert ignore.title == "Backend Engineer"
    assert repo.items == []


@pytest.mark.asyncio
async def test_create_preview_ignore_dedups_by_external_id() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    existing, _ = await service.create_preview_ignore(
        user,
        "loop-1",
        VacancyPreviewIgnoreRequest(
            source_id="arbeitsagentur",
            external_id="ref-1",
            source_url="https://example.com/jobs/123",
        ),
    )

    duplicate, created = await service.create_preview_ignore(
        user,
        "loop-1",
        VacancyPreviewIgnoreRequest(
            source_id="arbeitsagentur",
            external_id="ref-1",
            source_url="https://example.com/jobs/other",
        ),
    )

    assert created is False
    assert duplicate.id == existing.id
    assert len(repo.ignores) == 1


@pytest.mark.asyncio
async def test_list_preview_ignores_for_loop_returns_saved_ignores() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    await service.create_preview_ignore(
        user,
        "loop-1",
        VacancyPreviewIgnoreRequest(
            source_id="remotive",
            external_id=None,
            source_url="https://example.com/jobs/remote",
        ),
    )

    items, total = await service.list_preview_ignores_for_loop(user, "loop-1")

    assert total == 1
    assert items[0].source_id == "remotive"


@pytest.mark.asyncio
async def test_delete_preview_ignore_removes_saved_ignore() -> None:
    repo = FakeRepo()
    service = make_service(repo)
    user = make_user()
    ignore, _ = await service.create_preview_ignore(
        user,
        "loop-1",
        VacancyPreviewIgnoreRequest(
            source_id="remotive",
            external_id="remote-1",
            source_url="https://example.com/jobs/remote",
        ),
    )

    await service.delete_preview_ignore(user, "loop-1", ignore.id)

    items, total = await service.list_preview_ignores_for_loop(user, "loop-1")
    assert total == 0
    assert items == []


@pytest.mark.asyncio
async def test_delete_preview_ignore_unknown_id_is_safe() -> None:
    service = make_service(FakeRepo())

    with pytest.raises(VacancyMatchNotFoundError):
        await service.delete_preview_ignore(make_user(), "loop-1", uuid4())
