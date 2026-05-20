from __future__ import annotations

from dataclasses import dataclass, field
from types import SimpleNamespace
from uuid import UUID, uuid4

import pytest
from fastapi.testclient import TestClient

from app.auth.deps import get_current_user
from app.db.models.user import User
from app.main import create_app
from app.modules.discovery_adapters.base import DiscoveryAdapterError
from app.modules.discovery_adapters.adapters.arbeitsagentur import ArbeitsagenturAdapter
from app.modules.discovery_adapters.adapters.arbeitnow import ArbeitnowAdapter
from app.modules.discovery_adapters.adapters.adzuna import AdzunaAdapter
from app.modules.discovery_adapters.adapters.ats import GreenhouseAdapter, LeverAdapter
from app.modules.discovery_adapters.adapters.himalayas import HimalayasAdapter
from app.modules.discovery_adapters.adapters.remotive import RemotiveAdapter
from app.modules.discovery_adapters.adapters.remotejobs import RemoteJobsAdapter
from app.modules.discovery_adapters.adapters.remoteok import RemoteOkAdapter
from app.modules.discovery_adapters.registry import DiscoveryAdapterRegistry
from app.modules.discovery_adapters.schemas import (
    DiscoveryAdapterItem,
    DiscoveryAdapterOptions,
    DiscoveryAdapterResult,
)
from app.modules.discovery_runs.router import get_discovery_runs_service
from app.modules.discovery_runs.schemas import DiscoveryRunRequest
from app.modules.discovery_runs.service import DiscoveryRunsService
from app.modules.discovery_sources.schemas import DiscoverySource
from app.modules.loops.service import InvalidLoopError, LoopNotFoundError

USER_ID = uuid4()
LOOP_ID = UUID("4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0")


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
        "status": "active",
        "selected_sources": [],
        "auto_discovery_enabled": True,
        "last_discovery_at": None,
    }
    data.update(overrides)
    return SimpleNamespace(**data)


def make_source(
    source_id: str = "safe_source",
    *,
    enabled: bool = True,
    automatic_discovery: bool = True,
) -> DiscoverySource:
    return DiscoverySource(
        id=source_id,
        name="Safe Source",
        type="job_board",
        enabled=enabled,
        description="Test-only safe source.",
        countries=["DE"],
        base_url="https://example.com/jobs",
        capabilities={
            "manual_import": False,
            "automatic_discovery": automatic_discovery,
            "requires_credentials": False,
            "supports_filters": True,
        },
    )


class FakeAdapter:
    source_id = "safe_source"

    def __init__(self, item_count: int = 2) -> None:
        self.item_count = item_count
        self.calls: list[DiscoveryAdapterOptions] = []

    def supports_source(self, source_id: str) -> bool:
        return source_id == self.source_id

    async def discover(self, *, loop, source, options):
        self.calls.append(options)
        items = [
            DiscoveryAdapterItem(
                external_id=f"job-{index}",
                source_url=f"https://example.com/jobs/{index}",
                title=f"Backend Engineer {index}",
                company="Example GmbH",
                location="Berlin",
                snippet="Python and FastAPI role.",
                raw_metadata={"source": "test"},
                confidence={"source_quality": 0.9},
            )
            for index in range(self.item_count)
        ]
        return DiscoveryAdapterResult(
            source_id=source.id,
            status="completed",
            items_previewed=len(items),
            items=items,
        )


class FailingAdapter(FakeAdapter):
    async def discover(self, *, loop, source, options):
        raise DiscoveryAdapterError("safe failure")


class ArbeitsagenturLikeFakeAdapter(FakeAdapter):
    source_id = "arbeitsagentur"


@dataclass
class FakeLoopsService:
    loops: list = field(default_factory=lambda: [make_loop()])

    async def get_owned(self, user: User, loop_id: UUID):
        for loop in self.loops:
            if loop.id == loop_id and loop.user_id == user.id:
                return loop
        raise LoopNotFoundError()

    async def list_for_user(
        self,
        user: User,
        *,
        include_archived: bool = False,
        limit: int = 100,
        offset: int = 0,
    ):
        items = [loop for loop in self.loops if loop.user_id == user.id]
        if not include_archived:
            items = [loop for loop in items if loop.status != "archived"]
        return items[offset : offset + limit], len(items)


def make_service(
    loops: FakeLoopsService | None = None,
    adapter_registry: DiscoveryAdapterRegistry | None = None,
) -> DiscoveryRunsService:
    return DiscoveryRunsService(loops or FakeLoopsService(), adapter_registry)


def make_client(service: DiscoveryRunsService) -> TestClient:
    app = create_app()
    app.dependency_overrides[get_current_user] = current_user
    app.dependency_overrides[get_discovery_runs_service] = lambda: service
    return TestClient(app)


def test_discovery_run_endpoint_returns_skipped_result_for_loop_without_sources() -> None:
    last_seen = None
    loop = make_loop(selected_sources=[], last_discovery_at=last_seen)
    service = make_service(FakeLoopsService([loop]))

    with make_client(service) as client:
        response = client.post(
            "/api/v1/discovery-runs",
            json={"loop_id": str(LOOP_ID)},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed_with_warnings"
    assert data["dry_run"] is True
    assert data["loops_checked"] == 1
    assert data["sources_checked"] == 0
    assert data["matches_created"] == 0
    assert data["matches_previewed"] == 0
    assert data["items"] == [
        {
            "loop_id": str(LOOP_ID),
            "source_id": None,
            "status": "skipped",
            "reason": "no_sources_selected",
            "message": "No discovery sources selected for this Loop.",
            "items_previewed": 0,
            "has_more": False,
            "preview_items": [],
            "warnings": [],
            "errors": [],
        }
    ]
    assert loop.last_discovery_at is last_seen


@pytest.mark.asyncio
async def test_discovery_run_skips_source_without_automatic_discovery() -> None:
    loop = make_loop(selected_sources=["stepstone"])
    result = await make_service(FakeLoopsService([loop])).run(
        make_user(),
        DiscoveryRunRequest(loop_id=str(LOOP_ID), dry_run=False),
    )

    assert result.sources_checked == 0
    assert result.matches_created == 0
    assert result.items[0].source_id == "stepstone"
    assert result.items[0].status == "skipped"
    assert result.items[0].reason == "automatic_discovery_not_available"
    assert loop.last_discovery_at is None


@pytest.mark.asyncio
async def test_discovery_run_explicit_sources_can_extend_loop_sources() -> None:
    loop = make_loop(
        selected_sources=["arbeitsagentur"],
        target_role="Backend Engineer",
        location="Berlin",
    )
    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([ArbeitsagenturLikeFakeAdapter(item_count=1)]),
    ).run(
        make_user(),
        DiscoveryRunRequest(
            loop_id=str(LOOP_ID),
            source_ids=["arbeitsagentur", "remotive"],
        ),
    )

    assert [item.source_id for item in result.items] == ["arbeitsagentur", "remotive"]
    assert result.items[0].status == "would_run"
    assert result.items[1].reason == "source_adapter_not_implemented"


@pytest.mark.asyncio
async def test_discovery_run_dry_run_with_arbeitsagentur_returns_preview_items() -> None:
    loop = make_loop(
        selected_sources=["arbeitsagentur"],
        target_role="Backend Engineer",
        keywords=["Python"],
        location="Berlin",
        discovery_radius_km=25,
    )
    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([ArbeitsagenturLikeFakeAdapter(item_count=1)]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    assert result.sources_checked == 1
    assert result.matches_previewed == 1
    assert result.matches_created == 0
    assert result.items[0].source_id == "arbeitsagentur"
    assert result.items[0].status == "would_run"
    assert result.items[0].preview_items[0].title == "Backend Engineer 0"
    assert loop.last_discovery_at is None


def test_default_registry_resolves_arbeitsagentur_adapter() -> None:
    registry = DiscoveryAdapterRegistry([ArbeitsagenturAdapter()])
    adapter = registry.get_adapter("arbeitsagentur")

    assert adapter is not None
    assert adapter.supports_source("arbeitsagentur") is True


def test_adapter_registry_resolves_safe_mvp_adapters() -> None:
    registry = DiscoveryAdapterRegistry(
        [
            ArbeitsagenturAdapter(),
            ArbeitnowAdapter(),
            AdzunaAdapter(app_id="", app_key=""),
            RemotiveAdapter(),
            RemoteJobsAdapter(),
            HimalayasAdapter(),
            RemoteOkAdapter(),
            GreenhouseAdapter(board_tokens=[]),
            LeverAdapter(site_names=[]),
        ]
    )

    for source_id in [
        "arbeitsagentur",
        "adzuna",
        "arbeitnow",
        "remotive",
        "remotejobs",
        "himalayas",
        "remoteok",
        "greenhouse",
        "lever",
    ]:
        adapter = registry.get_adapter(source_id)
        assert adapter is not None
        assert adapter.supports_source(source_id) is True


@pytest.mark.asyncio
async def test_discovery_run_adapter_registry_resolves_safe_adapter(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    adapter = FakeAdapter()
    loop = make_loop(selected_sources=["safe_source"])

    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([adapter]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    assert result.sources_checked == 1
    assert result.matches_created == 0
    assert result.matches_previewed == 2
    assert result.items[0].status == "would_run"
    assert result.items[0].reason == "adapter_preview_ready"
    assert result.items[0].items_previewed == 2
    assert result.items[0].preview_items[0].source_url == "https://example.com/jobs/0"
    assert "application_id" not in result.model_dump_json()
    assert adapter.calls[0].dry_run is True
    assert adapter.calls[0].search_scope == "normal"
    assert loop.last_discovery_at is None


@pytest.mark.asyncio
async def test_discovery_run_unknown_adapter_source_is_unsupported(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    loop = make_loop(selected_sources=["safe_source"])

    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    assert result.sources_checked == 0
    assert result.items[0].status == "unsupported"
    assert result.items[0].reason == "source_adapter_not_implemented"
    assert result.matches_created == 0
    assert result.matches_previewed == 0


@pytest.mark.asyncio
async def test_discovery_run_non_dry_run_does_not_persist_matches(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    loop = make_loop(selected_sources=["safe_source"])

    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([FakeAdapter(item_count=1)]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID), dry_run=False))

    assert result.matches_created == 0
    assert result.matches_previewed == 1
    assert result.items[0].reason == "automatic_match_persistence_not_enabled"
    assert "automatic_match_persistence_not_enabled" in result.items[0].warnings
    assert loop.last_discovery_at is None


@pytest.mark.asyncio
async def test_discovery_run_adapter_errors_become_safe_response(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    loop = make_loop(selected_sources=["safe_source"])

    result = await make_service(
        FakeLoopsService([loop]),
        DiscoveryAdapterRegistry([FailingAdapter()]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    assert result.items[0].status == "failed"
    assert result.items[0].reason == "source_adapter_failed"
    assert result.items[0].errors == ["source_adapter_failed"]
    assert "safe failure" not in result.model_dump_json()


@pytest.mark.asyncio
async def test_discovery_run_passes_safety_limits_to_adapter(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    adapter = FakeAdapter(item_count=12)

    result = await make_service(
        FakeLoopsService([make_loop(selected_sources=["safe_source"])]),
        DiscoveryAdapterRegistry([adapter]),
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    assert adapter.calls[0].max_results == 5
    assert adapter.calls[0].timeout_seconds == 8
    assert adapter.calls[0].search_scope == "normal"
    assert adapter.calls[0].page == 1
    assert adapter.calls[0].page_size == 5
    assert result.matches_previewed == 5
    assert len(result.items[0].preview_items) == 5
    assert result.items[0].has_more is True


@pytest.mark.asyncio
async def test_discovery_run_passes_search_scope_to_adapter(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    adapter = FakeAdapter(item_count=1)

    await make_service(
        FakeLoopsService([make_loop(selected_sources=["safe_source"])]),
        DiscoveryAdapterRegistry([adapter]),
    ).run(
        make_user(),
        DiscoveryRunRequest(loop_id=str(LOOP_ID), search_scope="broad"),
    )

    assert adapter.calls[0].search_scope == "broad"


@pytest.mark.asyncio
async def test_discovery_run_passes_preview_page_to_adapter(monkeypatch) -> None:
    monkeypatch.setattr(
        "app.modules.discovery_runs.service.get_discovery_source",
        lambda source_id: make_source(source_id),
    )
    adapter = FakeAdapter(item_count=12)

    result = await make_service(
        FakeLoopsService([make_loop(selected_sources=["safe_source"])]),
        DiscoveryAdapterRegistry([adapter]),
    ).run(
        make_user(),
        DiscoveryRunRequest(loop_id=str(LOOP_ID), page=2, page_size=5),
    )

    assert adapter.calls[0].page == 2
    assert adapter.calls[0].page_size == 5
    assert result.page == 2
    assert result.page_size == 5


@pytest.mark.asyncio
async def test_discovery_run_returns_structured_item_for_unknown_source() -> None:
    result = await make_service(
        FakeLoopsService([make_loop(selected_sources=["unknown_source"])])
    ).run(
        make_user(),
        DiscoveryRunRequest(loop_id=str(LOOP_ID)),
    )

    assert result.status == "completed_with_warnings"
    assert result.items[0].status == "skipped"
    assert result.items[0].reason == "source_not_found"
    assert "unknown_source" in result.warnings[0]


def test_discovery_run_invalid_loop_id_returns_safe_error() -> None:
    with make_client(make_service()) as client:
        response = client.post(
            "/api/v1/discovery-runs",
            json={"loop_id": "not-a-uuid"},
            headers={"Authorization": "Bearer test"},
        )

    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "INVALID_LOOP"
    assert body["error"]["message"] == "Loop id must be a valid UUID"


@pytest.mark.asyncio
async def test_discovery_run_without_loop_id_uses_enabled_active_loops_only() -> None:
    active_enabled = make_loop(selected_sources=["manual_url"])
    disabled = make_loop(id=uuid4(), selected_sources=["stepstone"], auto_discovery_enabled=False)
    paused = make_loop(id=uuid4(), status="paused", selected_sources=["stepstone"])

    result = await make_service(
        FakeLoopsService([active_enabled, disabled, paused])
    ).run(make_user(), DiscoveryRunRequest())

    assert result.loops_checked == 1
    assert result.items[0].loop_id == str(active_enabled.id)
    assert result.items[0].source_id == "manual_url"
    assert result.items[0].reason == "automatic_discovery_not_available"


@pytest.mark.asyncio
async def test_discovery_run_response_has_no_removed_relation_fields() -> None:
    result = await make_service(
        FakeLoopsService([make_loop(selected_sources=["stepstone"])])
    ).run(make_user(), DiscoveryRunRequest(loop_id=str(LOOP_ID)))

    removed = "cy" + "cle"
    assert removed not in result.model_dump_json()
