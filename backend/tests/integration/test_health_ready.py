"""Integration tests for GET /api/v1/health/ready.

These tests require a live PostgreSQL instance reachable at DATABASE_URL.
Firebase auth is not involved — the endpoint is unauthenticated.
"""
import pytest
from httpx import ASGITransport, AsyncClient

pytestmark = pytest.mark.asyncio(loop_scope="session")

from app.main import create_app


@pytest.fixture(scope="module")
def readiness_app(setup_schema):  # noqa: ARG001 — ensures test DB is initialised
    return create_app()


async def test_readiness_200_with_live_db(readiness_app):
    """GET /health/ready returns 200 when PostgreSQL is reachable."""
    async with AsyncClient(
        transport=ASGITransport(app=readiness_app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health/ready")

    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


async def test_readiness_body_structure(readiness_app):
    """Readiness 200 response contains exactly the expected keys."""
    async with AsyncClient(
        transport=ASGITransport(app=readiness_app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health/ready")

    assert response.status_code == 200
    assert set(response.json().keys()) == {"status"}


async def test_readiness_no_auth_header_required(readiness_app):
    """Readiness endpoint is public — no Authorization header needed."""
    async with AsyncClient(
        transport=ASGITransport(app=readiness_app), base_url="http://test"
    ) as client:
        response = await client.get("/api/v1/health/ready", headers={})

    assert response.status_code == 200
