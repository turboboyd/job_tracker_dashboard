from __future__ import annotations

from dataclasses import dataclass, field
from datetime import UTC, datetime
from types import SimpleNamespace
from uuid import UUID, uuid4

from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.loops.router import get_loops_service
from app.modules.loops.service import LoopNotFoundError

USER_ID = uuid4()
OTHER_USER_ID = uuid4()
LOOP_ID = uuid4()
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


def make_loop(**overrides):
    data = {
        "id": LOOP_ID,
        "user_id": USER_ID,
        "title": "Frontend Ausbildung",
        "target_role": "Frontend Developer",
        "location": "Bremen",
        "radius_km": 50,
        "sources": ["company_site"],
        "keywords": [],
        "excluded_keywords": [],
        "employment_types": [],
        "work_modes": [],
        "selected_sources": [],
        "auto_discovery_enabled": False,
        "discovery_radius_km": None,
        "last_discovery_at": None,
        "status": "active",
        "created_at": NOW,
        "updated_at": NOW,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


@dataclass
class FakeLoopsService:
    loops: list = field(default_factory=lambda: [make_loop()])

    async def list_for_user(
        self,
        user: User,
        *,
        include_archived=False,
        limit=50,
        offset=0,
    ):
        items = [item for item in self.loops if item.user_id == user.id]
        if not include_archived:
            items = [item for item in items if item.status != "archived"]
        return items[offset : offset + limit], len(items)

    async def create(self, user: User, payload):
        loop = make_loop(
            id=uuid4(),
            user_id=user.id,
            title=payload.title,
            target_role=payload.target_role,
            location=payload.location,
            radius_km=payload.radius_km,
            sources=payload.sources,
            keywords=payload.keywords,
            excluded_keywords=payload.excluded_keywords,
            employment_types=payload.employment_types,
            work_modes=payload.work_modes,
            selected_sources=payload.selected_sources,
            auto_discovery_enabled=payload.auto_discovery_enabled,
            discovery_radius_km=payload.discovery_radius_km,
            status=payload.status,
        )
        self.loops.append(loop)
        return loop

    async def get_owned(self, user: User, loop_id: UUID):
        for loop in self.loops:
            if loop.id == loop_id and loop.user_id == user.id:
                return loop
        raise LoopNotFoundError()

    async def patch(self, user: User, loop_id: UUID, payload):
        loop = await self.get_owned(user, loop_id)
        updates = payload.model_dump(exclude_unset=True, exclude_none=True)
        for key, value in updates.items():
            setattr(loop, key, value)
        return loop

    async def archive(self, user: User, loop_id: UUID):
        loop = await self.get_owned(user, loop_id)
        loop.status = "archived"
        return loop

    async def get_metrics_by_loop_ids(
        self, loop_ids: list
    ) -> dict:
        return {
            str(lid): {"matches_saved": 0, "applications_total": 0}
            for lid in loop_ids
        }


def make_client(service: FakeLoopsService) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_loops_service] = lambda: service
    return TestClient(app)


def test_create_loop() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={"title": "Backend Jobs", "target_role": "Backend Engineer"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Backend Jobs"
    assert body["status"] == "active"
    assert len(service.loops) == 1


def test_list_own_loops() -> None:
    service = FakeLoopsService(
        loops=[
            make_loop(id=uuid4(), title="Own"),
            make_loop(id=uuid4(), user_id=OTHER_USER_ID, title="Other"),
        ]
    )
    with make_client(service) as client:
        response = client.get("/api/v1/loops", headers={"Authorization": "Bearer test"})

    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["title"] == "Own"


def test_get_own_loop() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.get(
            f"/api/v1/loops/{LOOP_ID}",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json()["id"] == str(LOOP_ID)


def test_patch_loop() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.patch(
            f"/api/v1/loops/{LOOP_ID}",
            json={"status": "paused", "location": "Berlin"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "paused"
    assert body["location"] == "Berlin"


def test_archive_loop_via_delete() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.delete(
            f"/api/v1/loops/{LOOP_ID}",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json()["status"] == "archived"


def test_user_cannot_access_another_users_loop() -> None:
    service = FakeLoopsService(loops=[make_loop(user_id=OTHER_USER_ID)])
    with make_client(service) as client:
        response = client.get(
            f"/api/v1/loops/{LOOP_ID}",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 404


def test_archived_loop_not_included_by_default() -> None:
    service = FakeLoopsService(loops=[make_loop(status="archived")])
    with make_client(service) as client:
        response = client.get("/api/v1/loops", headers={"Authorization": "Bearer test"})

    assert response.status_code == 200
    assert response.json()["items"] == []


def test_include_archived_includes_archived_loop() -> None:
    service = FakeLoopsService(loops=[make_loop(status="archived")])
    with make_client(service) as client:
        response = client.get(
            "/api/v1/loops?include_archived=true",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["items"][0]["status"] == "archived"


def test_create_loop_with_default_empty_search_settings() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={"title": "Clean Search"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["keywords"] == []
    assert body["excluded_keywords"] == []
    assert body["employment_types"] == []
    assert body["work_modes"] == []
    assert body["selected_sources"] == []
    assert body["auto_discovery_enabled"] is False
    assert body["discovery_radius_km"] is None
    assert body["last_discovery_at"] is None


def test_create_loop_with_search_settings() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={
                "title": "Backend Search",
                "keywords": ["Python", "FastAPI"],
                "excluded_keywords": ["Senior"],
                "employment_types": ["ausbildung"],
                "work_modes": ["hybrid"],
                "selected_sources": ["stepstone", "company_site"],
                "auto_discovery_enabled": True,
                "discovery_radius_km": 25,
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["keywords"] == ["Python", "FastAPI"]
    assert body["excluded_keywords"] == ["Senior"]
    assert body["employment_types"] == ["ausbildung"]
    assert body["work_modes"] == ["hybrid"]
    assert body["selected_sources"] == ["stepstone", "company_site"]
    assert body["auto_discovery_enabled"] is True
    assert body["discovery_radius_km"] == 25


def test_loop_search_settings_trim_and_deduplicate_arrays() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={
                "title": "Dedup Search",
                "keywords": [" Python ", "python", "", "FastAPI"],
                "selected_sources": [" StepStone ", "stepstone", "LinkedIn"],
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 201
    body = response.json()
    assert body["keywords"] == ["Python", "FastAPI"]
    assert body["selected_sources"] == ["StepStone", "LinkedIn"]


def test_create_loop_rejects_too_many_keywords() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={"title": "Too Many", "keywords": [f"kw-{i}" for i in range(31)]},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422


def test_list_loops_includes_metrics() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.get(
            "/api/v1/loops?include_archived=true",
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert "metrics" in item
    assert item["metrics"]["matches_saved"] == 0
    assert item["metrics"]["applications_total"] == 0


def test_create_loop_rejects_invalid_discovery_radius() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={"title": "Too Far", "discovery_radius_km": 251},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422


def test_patch_updates_selected_sources_and_auto_discovery_enabled() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.patch(
            f"/api/v1/loops/{LOOP_ID}",
            json={
                "selected_sources": ["StepStone", "stepstone", "Company site"],
                "auto_discovery_enabled": True,
            },
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["selected_sources"] == ["StepStone", "Company site"]
    assert body["auto_discovery_enabled"] is True
    assert body["title"] == "Frontend Ausbildung"


def test_patch_search_settings_does_not_require_all_fields() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.patch(
            f"/api/v1/loops/{LOOP_ID}",
            json={"keywords": ["React"]},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    body = response.json()
    assert body["keywords"] == ["React"]
    assert body["selected_sources"] == []


def test_last_discovery_at_cannot_be_set_from_create_payload() -> None:
    service = FakeLoopsService(loops=[])
    with make_client(service) as client:
        response = client.post(
            "/api/v1/loops",
            json={"title": "Hidden Field", "last_discovery_at": "2026-05-13T10:00:00Z"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422


def test_last_discovery_at_cannot_be_set_from_update_payload() -> None:
    service = FakeLoopsService()
    with make_client(service) as client:
        response = client.patch(
            f"/api/v1/loops/{LOOP_ID}",
            json={"last_discovery_at": "2026-05-13T10:00:00Z"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422
