# job-tracker-api

Python REST backend for [job-tracker-dashboard](../README.md).

## Tech stack

| Layer | Technology |
|---|---|
| Framework | FastAPI 0.115+ |
| Runtime | Python 3.12 |
| Database | PostgreSQL 16 |
| ORM | SQLAlchemy 2 (async) |
| Migrations | Alembic |
| Validation | Pydantic v2 |
| ASGI server | Uvicorn |

## Prerequisites

- Python 3.12+
- Docker & Docker Compose

## Setup

### 1. Install dependencies

```bash
cd backend

# using pip
pip install -e ".[dev]"

# or using uv (faster)
uv pip install -e ".[dev]"
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env — fill in real values as needed
```

Key variables:

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | asyncpg connection string | `postgresql+asyncpg://postgres:postgres@localhost:5432/job_tracker` |
| `CORS_ALLOWED_ORIGINS` | JSON array of allowed origins | `["http://localhost:3000"]` |
| `ENVIRONMENT` | `development` or `production` | `development` |
| `LOG_LEVEL` | `DEBUG`, `INFO`, `WARNING` | `INFO` |
| `FIREBASE_CREDENTIALS_JSON_PATH` | Absolute path to service-account JSON | `/path/to/serviceAccountKey.json` |
| `TEST_DATABASE_URL` | PostgreSQL URL for integration tests | `postgresql+asyncpg://...@localhost/job_tracker_test` |

### 3. Start PostgreSQL

```bash
docker compose up -d postgres
# Verify it is ready:
docker compose ps
```

### 4. Run database migrations

```bash
alembic upgrade head
```

To create a new migration after adding models:

```bash
alembic revision --autogenerate -m "describe the change"
alembic upgrade head
```

### 5. Start the API

```bash
uvicorn app.main:app --reload
```

The API is available at http://localhost:8000.

| URL | Description |
|---|---|
| `GET /api/v1/health` | Liveness probe |
| `GET /api/docs` | Swagger UI |
| `GET /api/redoc` | ReDoc |
| `GET /api/openapi.json` | OpenAPI schema |

## Running tests

```bash
pytest
```

With coverage report:

```bash
pytest --cov=app --cov-report=term-missing
```

Unit tests (health endpoint) run without a database or Firebase credentials.

Integration tests (`tests/integration/`) require a live PostgreSQL instance. They mock Firebase auth via `dependency_overrides` — no real credentials needed.

```bash
# Run only unit tests (no DB required)
pytest tests/test_health.py

# Run everything (DB must be running)
pytest

# Run integration tests against a dedicated test database
TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/job_tracker_test pytest tests/integration/
```

### Firebase Auth (Sprint 2)

All protected endpoints require `Authorization: Bearer <firebase-id-token>`.

```bash
# Obtain a token from Firebase (e.g. via the Firebase REST API or the frontend)
TOKEN="<your-firebase-id-token>"

curl -s http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" | jq .

# Patch display name
curl -s -X PATCH http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"display_name": "New Name", "language": "en"}' | jq .
```

Without `FIREBASE_CREDENTIALS_JSON_PATH` set the API returns `503 Service Unavailable` on all auth endpoints.

## Docker (full stack)

To run the API inside Docker alongside Postgres:

```bash
docker compose --profile full up --build
```

## Project structure

```
backend/
  app/
    api/v1/       — Route definitions
    auth/         — Firebase verifier, deps, ensure_local_user
    core/         — Settings, error handling, logging
    db/           — SQLAlchemy engine, session, declarative base, ORM models
    modules/
      users/      — GET + PATCH /users/me (router, schemas, service, repository)
  alembic/
    versions/     — Database migrations
  tests/
    integration/  — Real-DB tests with mocked Firebase
```

## Sprint status

| Sprint | Scope | Status |
|---|---|---|
| S1 | Foundation (this file) | ✅ Done |
| S2 | Firebase Auth + users | ✅ Done |
| S3 | Applications CRUD | ⏳ Pending |
| S4 | History + Activity feed | ⏳ Pending |
| S5 | Frontend REST gateway | ⏳ Pending |
| S6 | Analytics + cleanup | ⏳ Pending |
