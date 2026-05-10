"""Tests for GET /api/v1/health."""


def test_health_status_200(client):
    response = client.get("/api/v1/health")
    assert response.status_code == 200


def test_health_response_fields(client):
    data = client.get("/api/v1/health").json()
    assert data["status"] == "ok"
    assert data["service"] == "job-tracker-api"
    assert data["version"] == "0.1.0"


def test_health_content_type(client):
    response = client.get("/api/v1/health")
    assert "application/json" in response.headers["content-type"]


def test_health_no_auth_required(client):
    """Health endpoint must work without any Authorization header."""
    response = client.get("/api/v1/health", headers={})
    assert response.status_code == 200


def test_unknown_route_returns_404(client):
    response = client.get("/api/v1/nonexistent")
    assert response.status_code == 404
    body = response.json()
    assert "error" in body
    assert body["error"]["code"] == "404"
