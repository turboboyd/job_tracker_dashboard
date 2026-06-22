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

# Create and activate a virtual environment FIRST, then install into it.
# Installing into a venv (rather than a global/user Python) is what keeps
# the interpreter that runs the server in sync with the interpreter the
# dependencies were installed into — the #1 cause of "503 Authentication
# service is not configured" is launching uvicorn from a Python that does
# not have firebase-admin installed.
python -m venv .venv
# Windows (PowerShell):  .venv\Scripts\Activate.ps1
# macOS / Linux:         source .venv/bin/activate

# using pip
pip install -e ".[dev]"

# or using uv (faster)
uv pip install -e ".[dev]"
```

> Whenever you open a new terminal to run the server, tests, or migrations,
> **activate `.venv` again first.** If `firebase-admin` ever reports as missing,
> you are almost certainly in the wrong interpreter — re-activate and reinstall.

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

> **Port 5432 already occupied?** If another PostgreSQL instance (e.g., a
> different project) already uses port 5432 on your machine, change the
> published host port in `docker-compose.yml`:
>
> ```yaml
> ports:
>   - "5433:5432"   # host:container — use any free port on the left
> ```
>
> Then update `DATABASE_URL` (and optionally `TEST_DATABASE_URL`) in
> `backend/.env` to reference the new host port:
>
> ```bash
> DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/job_tracker
> TEST_DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5433/job_tracker_test
> ```

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

**Recommended (local full-stack):** use the dev runner. It binds
`127.0.0.1:8001` (the port the frontend expects) **in the current interpreter**,
so the running server always uses the venv you installed into, and it fails fast
with a clear message if `firebase-admin` is missing instead of returning a
cryptic 503 on every request later.

```bash
# from backend/, with .venv activated
python -m scripts.run_dev            # 127.0.0.1:8001, no autoreload (recommended)
python -m scripts.run_dev --reload   # opt-in autoreload, same interpreter
```

<details>
<summary>Plain uvicorn (equivalent)</summary>

```bash
# Default — API reachable at http://localhost:8000
python -m uvicorn app.main:app

# Frontend integration — match the React dev server's REST gateway default
python -m uvicorn app.main:app --host 127.0.0.1 --port 8001
```

Prefer `python -m uvicorn …` over the bare `uvicorn …` console script: `python -m`
runs uvicorn under the interpreter you invoke it with, whereas a bare `uvicorn`
resolves the first `uvicorn.exe` on `PATH`, which on Windows is frequently a
different environment that lacks `firebase-admin` → 503.
</details>

| Port | Scenario |
|---|---|
| **8000** | Docker (`docker compose --profile full up`), standalone backend dev |
| **8001** | Local full-stack: React dev server (port 3000) → REST gateway → backend |

> The React frontend's REST gateway is hard-coded to `http://127.0.0.1:8001/api/v1`
> (`src/shared/config/backendConfig.ts`). Use port **8001** when running both servers
> locally. The Docker `api` service publishes **8000** — see the comment in
> `docker-compose.yml` for how to change it.

> **On `--reload`.** Autoreload spawns a child process and, on Windows, that
> child can lose the dependency/env context if launched from a bare `uvicorn`
> on `PATH` — this is a classic source of the `No module named 'firebase_admin'`
> → 503 failure. `python -m scripts.run_dev` (and `python -m scripts.run_dev
> --reload`) avoid this by always re-using the current interpreter. Separately,
> the Firebase verifier is built lazily and cached per process, so an `.env`
> credential change needs a full restart regardless of `--reload`.

### Health probes

| URL | Type | Success | Failure |
|---|---|---|---|
| `GET /api/v1/health` | **Liveness** | `200 {"status":"ok", ...}` | — (always 200 if process is up) |
| `GET /api/v1/health/ready` | **Readiness** | `200 {"status":"ready"}` | `503 {"status":"degraded","reason":"database"}` |

Use `/health` as the process liveness check (container restart trigger).  
Use `/health/ready` as the traffic readiness check (load-balancer gate, deployment smoke).

| URL | Description |
|---|---|
| `GET /api/v1/health` | Liveness probe — always 200 while the process runs |
| `GET /api/v1/health/ready` | Readiness probe — 200 when DB reachable; 503 otherwise |
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

## Real Firebase Auth smoke test

Use this checklist to verify, end-to-end, that the backend accepts a real
Firebase ID token issued to the React app and provisions the matching local
user row. Everything below is doc/config-safe — no real `.env` or service
account is committed.

### 1. Place the Firebase service-account key (off-Git)

```bash
# from the repository root
mkdir -p backend/secrets
# Firebase Console → Project Settings → Service accounts → Generate new private key
# Save the downloaded JSON as:
#   backend/secrets/firebaseServiceAccount.json
```

`backend/secrets/` is listed in `backend/.gitignore` along with common
service-account filename patterns (`*serviceAccount*.json`,
`firebaseServiceAccount*.json`, `serviceAccountKey*.json`). Run
`git status` after dropping the file in — it must NOT appear.

> **Firebase project parity.** The service account must belong to the same
> Firebase project as the frontend web app (`src/shared/config/firebase/app.ts`).
> A project mismatch produces a generic 401 on every protected endpoint and
> is the most common smoke-test failure.

### 2. Point the backend at the key

In `backend/.env` (copied from `.env.example`):

```bash
FIREBASE_CREDENTIALS_JSON_PATH=/absolute/path/to/backend/secrets/firebaseServiceAccount.json
# Windows example:
# FIREBASE_CREDENTIALS_JSON_PATH=C:\Users\you\...\backend\secrets\firebaseServiceAccount.json
```

> **Restart required.** The Firebase verifier is built lazily on the first
> auth request and cached for the lifetime of the process. After editing
> `FIREBASE_CREDENTIALS_JSON_PATH` you must fully restart uvicorn — the
> `--reload` watcher does not rebuild the cached verifier on env-only changes.

### 3. Bring up Postgres and migrate

```bash
docker compose up -d postgres
alembic upgrade head
```

### 4. Run the API on port 8001

```bash
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8001
```

Port **8001** matches the frontend REST gateway default
(`http://127.0.0.1:8001/api/v1` in `src/shared/config/backendConfig.ts`).
Running on the default 8000 will leave every frontend REST call hitting a
closed port.

> **Docker profile note.** `docker compose --profile full up` publishes the
> API on **8000**, not 8001. If you use the docker profile, either change
> the published port or temporarily point the frontend REST config at 8000
> for that smoke run. Keep one canonical port per session to avoid confusion.

### 5. Start the frontend dev server

```bash
# from the repository root
npm run start
```

Open the app at **http://localhost:3000** and sign in with Firebase.

> **CORS host pinning.** `CORS_ALLOWED_ORIGINS` defaults to
> `["http://localhost:3000", "http://localhost:5173"]`. Opening the frontend
> at `http://127.0.0.1:3000` instead will be blocked by CORS unless you
> extend the list.

### 6. Grab a real ID token from DevTools

After signing in, open the browser console on the frontend tab and run:

```js
await firebase.auth().currentUser.getIdToken()
// or, with the modular SDK:
// await (await import("firebase/auth")).getAuth().currentUser.getIdToken()
```

Copy the returned string.

### 7. Hit `/api/v1/users/me`

```bash
TOKEN="<paste-the-id-token>"

curl -s http://127.0.0.1:8001/api/v1/users/me \
  -H "Authorization: Bearer $TOKEN" | jq .
```

**Expected outcome:**

- First call for a Firebase UID — backend creates a new row in `users`
  (`firebase_uid`, `email`, `display_name`, `photo_url` populated from the
  token claims) and returns the `UserRead` payload.
- Subsequent calls — backend returns the same row, refreshing
  `email` / `display_name` / `photo_url` if Firebase reports new values.
- Missing or malformed token → `401 Unauthorized`.
- `FIREBASE_CREDENTIALS_JSON_PATH` empty or wrong → `503 Service Unavailable`.

If the first call returns 200 and a row appears in `users`, the real-auth
path is healthy.

## Docker (full stack)

To run the API inside Docker alongside Postgres:

```bash
docker compose --profile full up --build
```

## Production readiness

Use [docs/backend-production.md](../docs/backend-production.md) as the server
planning runbook. It covers required environment variables, explicit migration
commands, health/readiness probes, CORS expectations, and the features that are
intentionally not enabled for production yet.

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
