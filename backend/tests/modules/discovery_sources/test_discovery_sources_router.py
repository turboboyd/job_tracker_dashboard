from __future__ import annotations

from fastapi.testclient import TestClient

from app.main import create_app
from app.core.config import get_settings
from app.modules.discovery_sources.registry import (
    get_discovery_source_ids,
    list_discovery_source_runtime_statuses,
)


def make_client() -> TestClient:
    return TestClient(create_app())


def test_list_discovery_sources_returns_stable_source_ids() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources")

    assert response.status_code == 200
    body = response.json()
    source_ids = {item["id"] for item in body["items"]}

    assert source_ids == {
        "manual_url",
        "arbeitsagentur",
        "adzuna",
        "arbeitnow",
        "remotive",
        "remotejobs",
        "himalayas",
        "remoteok",
        "greenhouse",
        "lever",
        "stepstone",
        "indeed",
        "linkedin",
        "xing",
        "company_websites",
    }
    assert source_ids == get_discovery_source_ids()


def test_each_discovery_source_has_required_metadata() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources")

    assert response.status_code == 200
    for source in response.json()["items"]:
        assert source["id"]
        assert source["name"]
        assert source["type"] in {"manual", "job_board", "company_site"}
        assert source["enabled"] is True
        assert source["description"]
        assert isinstance(source["countries"], list)
        assert set(source["capabilities"]) == {
            "manual_import",
            "automatic_discovery",
            "requires_credentials",
            "supports_filters",
        }


def test_only_safe_mvp_sources_have_automatic_discovery_enabled() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources")

    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["items"]}
    automatic_sources = {
        "arbeitsagentur",
        "adzuna",
        "arbeitnow",
        "remotive",
        "remotejobs",
        "himalayas",
        "remoteok",
        "greenhouse",
        "lever",
    }
    for source_id in automatic_sources:
        assert items[source_id]["capabilities"]["automatic_discovery"] is True
    for source_id, item in items.items():
        if source_id in automatic_sources:
            continue
        assert item["capabilities"]["automatic_discovery"] is False


def test_manual_url_source_supports_manual_import_only() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources")

    assert response.status_code == 200
    items = {item["id"]: item for item in response.json()["items"]}
    manual_url = items["manual_url"]

    assert manual_url["type"] == "manual"
    assert manual_url["capabilities"] == {
        "manual_import": True,
        "automatic_discovery": False,
        "requires_credentials": False,
        "supports_filters": False,
    }


def test_enabled_only_filter_returns_enabled_sources() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources?enabled_only=true")

    assert response.status_code == 200
    assert len(response.json()["items"]) == 15
    assert all(item["enabled"] is True for item in response.json()["items"])


def test_runtime_status_endpoint_does_not_expose_secret_values() -> None:
    with make_client() as client:
        response = client.get("/api/v1/discovery-sources/runtime-status")

    assert response.status_code == 200
    body = response.json()
    items = {item["source_id"]: item for item in body["items"]}

    assert items["arbeitsagentur"]["runnable"] is True
    assert items["arbeitnow"]["runnable"] is True
    assert items["remotive"]["runnable"] is True
    assert items["remotejobs"]["runnable"] is True
    assert items["himalayas"]["runnable"] is True
    assert items["remoteok"]["runnable"] is True
    assert items["adzuna"]["configuration_status"] in {"ready", "not_configured"}
    assert "ADZUNA_APP_KEY" not in response.text
    assert "ADZUNA_APP_ID" not in response.text


def test_runtime_status_respects_optional_source_configuration(monkeypatch) -> None:
    settings = get_settings().model_copy(
        update={
            "ADZUNA_APP_ID": "id",
            "ADZUNA_APP_KEY": "key",
            "GREENHOUSE_BOARD_TOKENS": "company-a, company-b",
            "LEVER_SITE_NAMES": "company-c",
        }
    )

    statuses = {
        item.source_id: item
        for item in list_discovery_source_runtime_statuses(settings)
    }

    assert statuses["adzuna"].runnable is True
    assert statuses["greenhouse"].runnable is True
    assert statuses["lever"].runnable is True
    assert statuses["stepstone"].runnable is False
    assert statuses["stepstone"].configuration_status == "not_runnable"
