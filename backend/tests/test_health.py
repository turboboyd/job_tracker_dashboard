"""Tests for GET /api/v1/health (liveness) and GET /api/v1/health/ready (readiness)."""


# ── Liveness ──────────────────────────────────────────────────────────────────

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


# ── Readiness — unit tests (DB mocked via monkeypatch) ────────────────────────

async def _db_up() -> bool:
    return True


async def _db_down() -> bool:
    return False


def test_readiness_200_when_db_reachable(client, monkeypatch):
    """Readiness endpoint returns 200 when check_db_connection returns True."""
    monkeypatch.setattr("app.api.v1.routes.check_db_connection", _db_up)
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ready"


def test_readiness_503_when_db_unreachable(client, monkeypatch):
    """Readiness endpoint returns 503 when check_db_connection returns False."""
    monkeypatch.setattr("app.api.v1.routes.check_db_connection", _db_down)
    response = client.get("/api/v1/health/ready")
    assert response.status_code == 503
    data = response.json()
    assert data["status"] == "degraded"
    assert data["reason"] == "database"


def test_readiness_no_auth_required(client, monkeypatch):
    """Readiness endpoint must not require an Authorization header."""
    monkeypatch.setattr("app.api.v1.routes.check_db_connection", _db_up)
    response = client.get("/api/v1/health/ready", headers={})
    assert response.status_code == 200


def test_readiness_content_type(client, monkeypatch):
    monkeypatch.setattr("app.api.v1.routes.check_db_connection", _db_up)
    response = client.get("/api/v1/health/ready")
    assert "application/json" in response.headers["content-type"]
