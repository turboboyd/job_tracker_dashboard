# Backend Production Readiness

This runbook covers the backend checks needed before planning a server deployment.
It contains placeholders only; do not paste real secrets into this file.

## Required Environment

Set these variables in the deployment environment:

| Variable | Required | Notes |
| --- | --- | --- |
| `ENVIRONMENT` | Yes | Use `production` on a real server. |
| `DATABASE_URL` | Yes | Must be a `postgresql+asyncpg://...` URL for the server database. Localhost URLs are rejected in production. |
| `CORS_ALLOWED_ORIGINS` | Yes | JSON array or comma-separated list of deployed frontend origins. Do not use `*` in production. |
| `FIREBASE_CREDENTIALS_JSON_PATH` | Yes | Filesystem path to a mounted Firebase service-account JSON file outside git. |
| `DOCUMENT_STORAGE_ROOT` | Yes | Filesystem path for uploaded documents. Back it up according to the server storage policy. |
| `FIREBASE_SERVICE_ACCOUNT_HOST_PATH` | Docker | Host path for the server-local Firebase JSON mount. |
| `CADDYFILE_HOST_PATH` | Docker | Host path for the server-local Caddyfile mount. |
| `LOG_LEVEL` | Recommended | Use `INFO` unless debugging a known issue. |
| `AI_ANALYSIS_PROVIDER` | Recommended | Defaults to `deterministic`. Set to `ollama` only when a local Ollama service is intentionally available. |
| `OLLAMA_BASE_URL` | Optional | Base URL for the local Ollama service. Keep it private. |
| `OLLAMA_MODEL` | Optional | Local model name used when `AI_ANALYSIS_PROVIDER=ollama`. |
| `OLLAMA_TIMEOUT_SECONDS` | Optional | Timeout for local Ollama calls. |
| `ADZUNA_APP_ID` | Optional | Server-side Adzuna API app id. Leave empty to skip Adzuna safely. |
| `ADZUNA_APP_KEY` | Optional | Server-side Adzuna API key. Leave empty to skip Adzuna safely. |
| `GREENHOUSE_BOARD_TOKENS` | Optional | Comma-separated Greenhouse board tokens for company boards to preview. |
| `LEVER_SITE_NAMES` | Optional | Comma-separated Lever company site names to preview. |

Keep `.env`, `backend/.env`, service-account files, uploads, logs, and archives out
of git. Use `.env.example` for placeholders only.

`DATABASE_URL` must come from the deployment environment. The application source
does not provide a real runtime database URL default.

For the first Docker Compose VPS deployment, use this server layout:

```text
/opt/job-tracker-dashboard/
  app/                 # repository checkout
  deploy/              # server-local backend.env and Caddyfile
  secrets/             # Firebase service-account JSON
  storage/documents/   # persistent documents
  backups/postgres/
  backups/documents/
```

The real files below are server-local and must not be committed:

- `/opt/job-tracker-dashboard/deploy/backend.env`
- `/opt/job-tracker-dashboard/deploy/Caddyfile`
- `/opt/job-tracker-dashboard/secrets/firebase-service-account.json`

## Install And Start

From `backend/`:

```powershell
.venv\Scripts\python.exe -m pip install .
.venv\Scripts\alembic.exe upgrade head
.venv\Scripts\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

For Linux servers the same commands apply with the environment's Python and
Alembic executables.

Use `.[dev]` only for local verification environments that need pytest, ruff,
or mypy.

For the Docker Compose VPS skeleton, see
[Docker Deployment Skeleton](deployment-docker.md). It keeps migrations
explicit, mounts Firebase credentials read-only, and uses Caddy for HTTPS.
It also includes a source adapter smoke command for verifying safe discovery
source readiness without printing secrets.

## Health Checks

Use the public probes below:

| Endpoint | Purpose | Expected ready response |
| --- | --- | --- |
| `GET /api/v1/health` | Liveness, no database dependency | `200 {"status":"ok",...}` |
| `GET /api/v1/health/ready` | Readiness, checks database connectivity | `200 {"status":"ready"}` |

If the database is unavailable, readiness returns `503` with a safe body:

```json
{
  "status": "degraded",
  "reason": "database"
}
```

## Source Adapter Smoke

Use the source adapter smoke command after editing server-local `backend.env`
and before treating discovery preview as ready:

```bash
python -m scripts.check_discovery_source_status
```

In Docker Compose, run it through the `api` service:

```bash
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status
```

The command reports only source ids, status flags, and message codes. It must
not print API keys, company token lists, Firebase JSON, database URLs, or raw
env values.

## Migrations

Run migrations before sending traffic to a new release:

```powershell
.venv\Scripts\alembic.exe heads
.venv\Scripts\alembic.exe current
.venv\Scripts\alembic.exe upgrade head
```

There is no automatic migration on application startup. Keep migration execution
as an explicit deployment step.

## Security And Errors

- CORS is driven by `CORS_ALLOWED_ORIGINS`.
- Production startup rejects wildcard CORS origins.
- API errors use a structured envelope with a request id.
- Unhandled errors return `INTERNAL_ERROR` to clients and log server-side details.
- Startup and request logs must not include credential values.
- Vacancy analysis stores resume hashes and saved analysis results; it must not
  log or persist raw resume text. Raw resume/vacancy text is sent to Ollama only
  when `AI_ANALYSIS_PROVIDER=ollama`.
- `/api/v1/dev/users/me/analysis-plan` is a development-only testing helper.
  In production it must not update users and should return 404. Real plan
  assignment remains future billing/admin-console work.
- Do not expose Ollama publicly. Keep it on localhost, the Docker network, or a
  private network protected by firewall rules.
- Safe discovery adapters are opt-in and bounded. Adzuna requires server-side
  keys, Greenhouse and Lever require explicit company lists, and no adapter
  creates Applications automatically.
- Source adapter setup and runtime status checks are documented in
  [Source Adapter Setup](source-adapter-setup.md).

## Intentional Non-Features

The production deployment must not enable these without separate implementation
and review:

- automatic scraping or crawling
- scheduler or cron deployment for discovery
- AI or external-service scoring
- external hosted AI provider calls for vacancy analysis
- automatic Application creation
- source credentials for job boards
