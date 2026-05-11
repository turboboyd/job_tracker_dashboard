"""Tests for X-Request-ID middleware and request_id in error responses.

No database required — all tests use the synchronous TestClient.
raise_server_exceptions=False is intentional: the 500 test needs the
unhandled_exception_handler to run rather than the test framework re-raising.
"""
from __future__ import annotations

import re
import uuid
from unittest.mock import patch

import pytest
from fastapi import Query
from fastapi.testclient import TestClient

from app.main import create_app

_UUID4 = re.compile(
    r"^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$"
)


@pytest.fixture(scope="module")
def client():
    app = create_app()

    # No-auth route used to trigger 422 without needing Firebase credentials.
    # Auth dependencies in all production routes run before param validation,
    # so we need a dedicated route where validation is the only dependency.
    @app.get("/test/int-param", include_in_schema=False)
    async def _int_param(n: int = Query()) -> dict:
        return {"n": n}

    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


# ── X-Request-ID response header on success ───────────────────────────────


def test_success_response_has_request_id_header(client):
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    assert "x-request-id" in r.headers


def test_generated_request_id_is_uuid4(client):
    r = client.get("/api/v1/health")
    rid = r.headers.get("x-request-id", "")
    assert _UUID4.match(rid), f"Expected UUID4, got: {rid!r}"


def test_different_requests_get_different_ids(client):
    r1 = client.get("/api/v1/health")
    r2 = client.get("/api/v1/health")
    assert r1.headers["x-request-id"] != r2.headers["x-request-id"]


# ── Incoming X-Request-ID is echoed or replaced ───────────────────────────


def test_safe_request_id_is_preserved(client):
    custom = "my-trace-abc123"
    r = client.get("/api/v1/health", headers={"X-Request-ID": custom})
    assert r.headers.get("x-request-id") == custom


def test_uuid_request_id_is_preserved(client):
    custom = str(uuid.uuid4())
    r = client.get("/api/v1/health", headers={"X-Request-ID": custom})
    assert r.headers.get("x-request-id") == custom


def test_unsafe_request_id_is_replaced(client):
    """Incoming ID with characters outside [A-Za-z0-9\\-_] must be replaced."""
    r = client.get("/api/v1/health", headers={"X-Request-ID": "<script>xss</script>"})
    rid = r.headers.get("x-request-id", "")
    assert _UUID4.match(rid), f"Unsafe ID should have been replaced, got: {rid!r}"


def test_oversized_request_id_is_replaced(client):
    """Incoming ID longer than 64 characters must be replaced."""
    long_id = "a" * 65
    r = client.get("/api/v1/health", headers={"X-Request-ID": long_id})
    rid = r.headers.get("x-request-id", "")
    assert _UUID4.match(rid), f"Oversized ID should have been replaced, got: {rid!r}"


# ── X-Request-ID header present on error responses ────────────────────────


def test_request_id_header_on_404(client):
    r = client.get("/api/v1/nonexistent")
    assert r.status_code == 404
    assert "x-request-id" in r.headers


def test_request_id_header_on_401(client):
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401
    assert "x-request-id" in r.headers


def test_request_id_header_on_422(client):
    r = client.get("/test/int-param?n=not-a-number")
    assert r.status_code == 422
    assert "x-request-id" in r.headers


# ── request_id field in error body ────────────────────────────────────────


def test_404_error_body_has_request_id(client):
    r = client.get("/api/v1/nonexistent")
    body = r.json()
    assert "request_id" in body["error"]
    assert body["error"]["request_id"]


def test_401_error_body_has_request_id(client):
    r = client.get("/api/v1/users/me")
    assert r.status_code == 401
    body = r.json()
    assert "request_id" in body["error"]
    assert body["error"]["request_id"]


def test_422_error_body_has_request_id(client):
    r = client.get("/test/int-param?n=not-a-number")
    assert r.status_code == 422
    body = r.json()
    assert "request_id" in body["error"]
    assert body["error"]["request_id"]


def test_error_body_request_id_matches_header(client):
    """The request_id in the error body must equal the X-Request-ID header."""
    r = client.get("/api/v1/nonexistent")
    assert r.json()["error"]["request_id"] == r.headers["x-request-id"]


def test_custom_id_appears_in_error_body(client):
    """A caller-supplied X-Request-ID must appear in both header and error body."""
    custom = "trace-0042"
    r = client.get("/api/v1/nonexistent", headers={"X-Request-ID": custom})
    assert r.headers.get("x-request-id") == custom
    assert r.json()["error"]["request_id"] == custom


# ── Unhandled exception (500) ─────────────────────────────────────────────


def test_unhandled_exception_returns_500_with_request_id(client):
    """RuntimeError in a route handler → 500 with request_id, no stack trace leaked."""

    async def _boom():
        raise RuntimeError("internal details must not leak")

    with patch("app.api.v1.routes.check_db_connection", new=_boom):
        r = client.get("/api/v1/health/ready")

    assert r.status_code == 500
    body = r.json()
    assert body["error"]["code"] == "INTERNAL_ERROR"
    assert body["error"]["message"] == "An unexpected error occurred"
    assert "internal details must not leak" not in body["error"]["message"]
    assert "request_id" in body["error"]
    assert body["error"]["request_id"]


def test_unhandled_exception_request_id_in_header(client):
    """500 response must also carry the X-Request-ID header."""

    async def _boom():
        raise RuntimeError("boom")

    with patch("app.api.v1.routes.check_db_connection", new=_boom):
        r = client.get("/api/v1/health/ready")

    assert r.status_code == 500
    assert "x-request-id" in r.headers
    assert r.json()["error"]["request_id"] == r.headers["x-request-id"]
