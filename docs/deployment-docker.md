# Docker Deployment Skeleton

This is a planning skeleton for the first VPS deployment. It uses Docker
Compose with a FastAPI backend container, PostgreSQL, and Caddy as the reverse
proxy. Do not paste real secrets into this repository.

## Files

- `backend/Dockerfile` builds the backend runtime image.
- `docker-compose.prod.yml` defines `api`, `postgres`, and `proxy` services.
- `deploy/backend.env.example` documents required production variables.
- `deploy/Caddyfile.example` shows the Caddy reverse proxy shape.

The server layout is:

```text
/opt/job-tracker-dashboard/
  app/                 # repository checkout
  deploy/              # server-local env and Caddyfile, outside git
  secrets/             # Firebase service-account JSON, outside git
  storage/documents/   # persistent document storage
  backups/postgres/
  backups/documents/
```

Create server-local files from the examples:

```bash
cp /opt/job-tracker-dashboard/app/deploy/backend.env.example /opt/job-tracker-dashboard/deploy/backend.env
cp /opt/job-tracker-dashboard/app/deploy/Caddyfile.example /opt/job-tracker-dashboard/deploy/Caddyfile
```

Edit those server-local files on the VPS. The real `backend.env` and Caddyfile
must not be committed.

## Backend Image

The image installs runtime dependencies from `backend/pyproject.toml`, copies
the application and Alembic files, runs as a non-root user, exposes port `8000`,
and starts:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

It must not contain `.env`, `backend/secrets/`, `.venv`, tests, caches, logs,
archives, or local storage.

## Environment

Required production variables:

- `ENVIRONMENT`
- `DATABASE_URL`
- `CORS_ALLOWED_ORIGINS`
- `FIREBASE_CREDENTIALS_JSON_PATH`
- `FIREBASE_SERVICE_ACCOUNT_HOST_PATH`
- `CADDYFILE_HOST_PATH`
- `DOCUMENT_STORAGE_ROOT`
- `LOG_LEVEL`
- `APP_NAME`
- `APP_VERSION`
- `POSTGRES_DB`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `AI_ANALYSIS_PROVIDER`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_SECONDS`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `GREENHOUSE_BOARD_TOKENS`
- `LEVER_SITE_NAMES`

Use exact frontend origins in `CORS_ALLOWED_ORIGINS`. Do not use `*` in
production.

`DATABASE_URL` must be provided by the deployment environment. The application
source does not provide a real runtime database default.

`AI_ANALYSIS_PROVIDER=deterministic` is the default and requires no model
runtime. Set `AI_ANALYSIS_PROVIDER=ollama` only after a local Ollama service is
available to the backend over localhost, Docker networking, or another private
network path.

Safe discovery source adapters are configured through server-side env only:
Adzuna needs `ADZUNA_APP_ID` and `ADZUNA_APP_KEY`; Greenhouse uses
`GREENHOUSE_BOARD_TOKENS`; Lever uses `LEVER_SITE_NAMES`. Leave these empty to
skip the source without failing discovery runs.

For source-specific setup and runtime verification, see
[Source Adapter Setup](source-adapter-setup.md).

After the API container has the server env, you can also run:

```bash
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status
```

## Firebase Credential Mount

Place the Firebase service-account JSON on the server outside the repository,
for example:

```bash
/opt/job-tracker-dashboard/secrets/firebase-service-account.json
```

Mount it read-only into the backend container through
`FIREBASE_SERVICE_ACCOUNT_HOST_PATH`. The app reads it from
`FIREBASE_CREDENTIALS_JSON_PATH`.

## Storage

Uploaded documents are stored at `DOCUMENT_STORAGE_ROOT`, mounted as the
`documents_data` Docker volume in the production Compose file. Include this
volume in the backup plan.

## Caddyfile Mount

`CADDYFILE_HOST_PATH` points Compose to the server-local Caddyfile, for example:

```bash
CADDYFILE_HOST_PATH=/opt/job-tracker-dashboard/deploy/Caddyfile
```

Keep `deploy/Caddyfile.example` in git as a template, and keep the real
server Caddyfile outside git.

## Migration Flow

Run migrations explicitly before starting or replacing the API:

```bash
cd /opt/job-tracker-dashboard/app
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml config
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml build api
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml up -d postgres
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api alembic heads
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api alembic current
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api alembic upgrade head
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml up -d api proxy
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml ps
```

Take a database backup before migrations.

## Health Checks

After deployment:

```bash
curl -i https://api.example.com/api/v1/health
curl -i https://api.example.com/api/v1/health/ready
```

`/api/v1/health` is the liveness probe. `/api/v1/health/ready` checks database
connectivity and should gate traffic.

## Source Adapter Smoke

After changing `../deploy/backend.env`, run:

```bash
cd /opt/job-tracker-dashboard/app
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status
```

Expected MVP baseline:

- `arbeitsagentur`: `ready`
- `arbeitnow`: `ready`
- `remotive`: `ready`
- `remotejobs`: `ready`
- `adzuna`: `ready` only when `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are set
- `greenhouse`: `ready` only when `GREENHOUSE_BOARD_TOKENS` has at least one token
- `lever`: `ready` only when `LEVER_SITE_NAMES` has at least one site
- StepStone, Indeed, LinkedIn, and XING: `not_runnable`

To make deployment fail when a required source is not runnable:

```bash
docker compose --env-file ../deploy/backend.env -f docker-compose.prod.yml run --rm api python -m scripts.check_discovery_source_status --require arbeitsagentur --require arbeitnow --require remotive --require remotejobs
```

The command must print only source ids, status flags, and message codes. It must
not print API keys, company lists, Firebase JSON, database URLs, or other
secret values.

## Local LLM Provider

Ollama is optional. If enabled, configure:

- `AI_ANALYSIS_PROVIDER=ollama`
- `OLLAMA_BASE_URL`
- `OLLAMA_MODEL`
- `OLLAMA_TIMEOUT_SECONDS`

Do not expose Ollama directly to the public internet. The backend sends
resume/vacancy text to Ollama only in this mode, and raw resume text is still
not persisted by the application.

## Backups

For the MVP Compose setup, back up:

- PostgreSQL data with `pg_dump` or volume snapshots.
- `documents_data`.
- server-local deployment env files and Caddyfile, stored securely outside git.
- Firebase credential file, stored securely outside git.

## Intentional Non-Features

This deployment skeleton does not add automatic scraping, scheduler deployment,
AI scoring, source credentials, or automatic Application creation.
