# Backend API Contract

REST API for the Job Tracker Dashboard. Firebase Auth is the only login provider; all data reads and writes go through this API.

## Base URLs

| Context | URL |
|---|---|
| Local dev (uvicorn direct) | `http://127.0.0.1:8001/api/v1` |
| Docker / standalone | `http://127.0.0.1:8000/api/v1` |
| OpenAPI schema | `/api/openapi.json` |
| Swagger UI | `/api/docs` |
| ReDoc | `/api/redoc` |

> The React dev server REST gateway is hard-coded to `http://127.0.0.1:8001/api/v1`. Always run uvicorn on port **8001** when doing local full-stack development.

---

## Authentication

Firebase Auth issues ID tokens; the backend verifies them with the Firebase Admin SDK.

**Header required on every protected endpoint:**
```
Authorization: Bearer <Firebase ID token>
```

**Error cases:**

| Situation | Status | Body |
|---|---|---|
| Missing `Authorization` header | `401` | `{"error":{"code":"401","message":"Missing Authorization header"}}` |
| Invalid or expired token | `401` | `{"error":{"code":"401","message":"Invalid or expired token"}}` |
| Firebase Admin SDK not configured on server | `503` | `{"error":{"code":"503","message":"Authentication service is not configured"}}` |

**User provisioning:** The first authenticated request for a Firebase UID automatically creates a local `users` row (idempotent). All subsequent calls return the same row.

---

## Request tracing (X-Request-ID)

Every response carries an `X-Request-ID` header:

- If the caller sends `X-Request-ID` with alphanumeric/hyphen/underscore characters and length ≤ 64, the same value is echoed back.
- Otherwise a fresh UUID v4 is generated server-side.

The resolved ID is also included in every **error** response body as `error.request_id` (see below). Use it to correlate client-side error logs with server-side log lines.

---

## Error envelope

All error responses share a single shape:

```json
{
  "error": {
    "code": "string",
    "message": "string",
    "request_id": "string"
  }
}
```

`request_id` always equals the value in the `X-Request-ID` response header for that request.

| Status | `code` value | Trigger |
|---|---|---|
| 401 | `"401"` | Missing or invalid token |
| 404 | `"404"` | Resource not found (or belongs to another user) |
| 422 | `"VALIDATION_ERROR"` | Pydantic validation failure |
| 500 | `"INTERNAL_ERROR"` | Unhandled server exception |
| 503 | `"503"` | Firebase Admin not configured / DB unreachable |

---

## Health

These two endpoints are **public** (no `Authorization` header required).

### GET /health

Liveness probe — confirms the API process is running. Always returns 200 as long as the process is up.

```
GET /api/v1/health
```

**Response 200:**
```json
{
  "status": "ok",
  "service": "job-tracker-api",
  "version": "0.1.0"
}
```

### GET /health/ready

Readiness probe — confirms the database is reachable. Use this as a load-balancer gate or deployment smoke test.

```
GET /api/v1/health/ready
```

**Response 200 — database reachable:**
```json
{
  "status": "ready"
}
```

**Response 503 — database unreachable:**
```json
{
  "status": "degraded",
  "reason": "database"
}
```

---

## Users

### GET /users/me

Return the current user's profile. Creates the local DB record on first call.

```
GET /api/v1/users/me
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "firebase_uid": "abc123xyz",
  "email": "user@example.com",
  "display_name": "Jane Doe",
  "photo_url": "https://example.com/photo.jpg",
  "language": "ru",
  "timezone": "Europe/Berlin",
  "date_format": "DD.MM.YYYY",
  "analysis_plan": "free",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Read-only fields** (cannot be changed via PATCH): `id`, `firebase_uid`, `email`, `photo_url`, `analysis_plan`, `created_at`.

### GET /users/me/analysis-plan

Return the current user's analysis plan, daily limits and feature flags. This
endpoint is read-only. Users cannot upgrade themselves through the API; billing
and admin authorization are future work.

```
GET /api/v1/users/me/analysis-plan
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "plan": "free",
  "limits": {
    "basic_daily_limit": 10,
    "ai_daily_limit": 1
  },
  "features": {
    "cover_letter": "short_template",
    "interview_questions": false,
    "cv_keywords": true,
    "multi_match_comparison": false,
    "priority": "normal"
  }
}
```

Current plan storage is `users.analysis_plan`, defaulting to `free`. Safe
development changes can be made with an explicit database update, for example:

```sql
update users set analysis_plan = 'basic' where firebase_uid = '<firebase uid>';
```

Do not expose a public self-upgrade endpoint until payment and admin
authorization are implemented.

### PATCH /dev/users/me/analysis-plan

Development-only helper for switching the authenticated user's analysis plan
during local testing. It is not billing and does not mark a user as paid.

```
PATCH /api/v1/dev/users/me/analysis-plan
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "plan": "basic"
}
```

**Response 200 in development:**
```json
{
  "plan": "basic",
  "message": "Analysis plan updated for development testing."
}
```

**Production behavior:** returns 404 and does not update the user. Never expose
this as a production self-upgrade path. Real plan assignment remains future
billing/admin-console work.

### PATCH /users/me

Update the current user's preferences or display name. Fields omitted from the body are left unchanged; sending `null` skips a field (does not clear it).

```
PATCH /api/v1/users/me
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body** (all fields optional):
```json
{
  "display_name": "Jane D.",
  "language": "en",
  "timezone": "America/New_York",
  "date_format": "MM/DD/YYYY"
}
```

**Response 200:** Same shape as `GET /users/me`.

**Validation:** Extra fields not listed above are rejected with `422`.

---



## Vacancy Import Preview

MVP-safe vacancy import is limited to one user-provided vacancy URL at a time. The backend fetches a small HTML preview, extracts editable fields, and returns them to the client. It does **not** create an application and does **not** store imported HTML.

Legal/product constraints:

- no mass scraping
- no crawling job boards
- no collection of HR contacts, emails, or phone numbers
- no login/captcha/robots/anti-bot bypass
- user must confirm the preview before creating an application
- applications stay linked to `loop_id`; no separate legacy search concept exists

### POST /vacancy-import/preview

```
POST /api/v1/vacancy-import/preview
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "url": "https://example.com/careers/frontend-developer"
}
```

**Response 200:**
```json
{
  "source_url": "https://example.com/careers/frontend-developer",
  "source": "example.com",
  "company_name": "Example GmbH",
  "role_title": "Frontend Developer",
  "location_text": "Berlin",
  "vacancy_description": "Build user interfaces with TypeScript.",
  "confidence": {
    "company_name": 0.9,
    "role_title": 0.95,
    "location_text": 0.85,
    "vacancy_description": 0.9
  },
  "warnings": []
}
```

**Validation / fetch rules:**

- only `http` and `https` URLs are accepted
- localhost, loopback, private, link-local, metadata and reserved IPs are rejected
- URL length is capped at 2048 characters
- fetch timeout is approximately 7 seconds
- response size is capped at approximately 2 MB
- only `text/html` / XHTML content is accepted
- extraction priority: JSON-LD `JobPosting`, then OpenGraph/meta/title, then visible text fallback

---


## Loops

Loops are backend-owned search directions. They are the only search-direction concept. Applications and vacancy matches link to Loops through `loop_id`.

Supported statuses: `active`, `paused`, `archived`.

### Loop search settings

Loops can now store search configuration for future vacancy discovery. These fields are configuration only in this step; the discovery runner/background job is intentionally not implemented yet.

Search-setting fields:

- `keywords`: search terms for the Loop. The API trims strings, removes empty values, deduplicates case-insensitively, and stores at most 30 items.
- `excluded_keywords`: terms to exclude from future discovery. The API applies the same normalization and stores at most 30 items.
- `employment_types`: employment filters such as `full_time`, `part_time`, `ausbildung`, or project-specific values. At most 10 items.
- `work_modes`: work-mode filters such as `remote`, `hybrid`, or `onsite`. At most 10 items.
- `selected_sources`: discovery-oriented source identifiers from the Discovery Source Registry. At most 20 items. Unknown ids are not rejected yet, so older saved settings remain editable while the registry settles.
- `auto_discovery_enabled`: boolean flag, default `false`. It stores whether future automatic discovery should be enabled for the Loop. It does not start discovery by itself in this step.
- `discovery_radius_km`: optional discovery radius from 0 to 250 km. This is the new discovery-oriented radius field.
- `last_discovery_at`: read-only timestamp for the last discovery run. It is exposed in responses but cannot be set through public create/update payloads.

Backward compatibility: existing `sources` and `radius_km` fields are still kept. `selected_sources` and `discovery_radius_km` are the new discovery-oriented fields and will be used by later discovery work.

## Discovery Sources

Discovery Source Registry is backend-owned and static in F21. It exposes supported source definitions so Loop settings can store stable `selected_sources` ids. The endpoint does not fetch vacancies, crawl websites, run background jobs, score matches, or use credentials.

### GET /discovery-sources/runtime-status

Returns safe runtime configuration flags for discovery sources. This endpoint
does not expose env values, API keys, company token lists, or credentials.

```json
{
  "items": [
    {
      "source_id": "adzuna",
      "name": "Adzuna Germany",
      "automatic_discovery": true,
      "configured": false,
      "runnable": false,
      "configuration_status": "not_configured",
      "message_code": "adzuna_not_configured"
    }
  ]
}
```

Status semantics:

- `ready`: source is marked for bounded discovery and has required server-side configuration.
- `not_configured`: source is marked for bounded discovery but required server-side configuration is missing.
- `not_runnable`: source is known but not enabled for bounded discovery runs.

Operational setup for source-specific env values is documented in
[Source Adapter Setup](source-adapter-setup.md).

### GET /discovery-sources

Returns available discovery source definitions.

```http
GET /api/v1/discovery-sources?enabled_only=false
```

Example response:

```json
{
  "items": [
    {
      "id": "manual_url",
      "name": "Manual URL",
      "type": "manual",
      "enabled": true,
      "description": "User-provided vacancy URL. The system can keep the link and user-entered details.",
      "countries": [],
      "base_url": null,
      "capabilities": {
        "manual_import": true,
        "automatic_discovery": false,
        "requires_credentials": false,
        "supports_filters": false
      }
    }
  ]
}
```

Initial source ids:

- `manual_url`
- `arbeitsagentur`
- `arbeitnow`
- `adzuna`
- `remotive`
- `remotejobs`
- `himalayas`
- `remoteok`
- `greenhouse`
- `lever`
- `stepstone`
- `indeed`
- `linkedin`
- `xing`
- `company_websites`

F38/F45.x enables `automatic_discovery = true` only for reviewed safe adapters:
`arbeitsagentur`, `arbeitnow`, `adzuna`, `remotive`, `remotejobs`, `himalayas`, `remoteok`, `greenhouse`, and `lever`.
StepStone, Indeed, LinkedIn, XING, manual URL, and broad company website sources
remain registry-only for discovery runs.

## Discovery Preview

Manual source-based discovery preview is request-driven and read-only. It validates a `loop_id`, validates `source_id` against the Discovery Source Registry, previews one user-provided URL, and returns a suggested vacancy match payload for the caller to inspect. It does not save a vacancy match, create an application, schedule work, crawl job boards, score results, or deduplicate records.

Only sources with `capabilities.manual_import = true` support this endpoint. In the initial registry this means `manual_url`.

### POST /discovery-preview

```
POST /api/v1/discovery-preview
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "source_id": "manual_url",
  "url": "https://example.com/careers/frontend-developer"
}
```

**Response 200:**
```json
{
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "source_id": "manual_url",
  "status": "ready",
  "normalized_url": "https://example.com/careers/frontend-developer",
  "title": "Frontend Developer",
  "company": "Example GmbH",
  "location": "Berlin",
  "snippet": "Build user interfaces with TypeScript.",
  "external_id": null,
  "warnings": [],
  "can_create_match": true,
  "match": {
    "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
    "source_id": "manual_url",
    "source_url": "https://example.com/careers/frontend-developer",
    "source": "example.com",
    "company_name": "Example GmbH",
    "role_title": "Frontend Developer",
    "location_text": "Berlin",
    "vacancy_description": "Build user interfaces with TypeScript.",
    "confidence": { "role_title": 0.95 },
    "warnings": [],
    "status": "saved"
  }
}
```

**Validation rules:**

- `loop_id` is required and must point to an active current-user Loop.
- `source_id` is required, must exist in the Discovery Source Registry, must be enabled, and must support manual import.
- `url` follows the same safe URL validation and fetch protections as `POST /vacancy-import/preview`.
- Unknown sources return `400 UNKNOWN_DISCOVERY_SOURCE`.
- Sources without manual preview support return `400 DISCOVERY_SOURCE_MANUAL_PREVIEW_UNSUPPORTED`.
- Invalid or unavailable Loops return the same Loop validation errors used by application and vacancy-match writes.

## Discovery Runs

Discovery runs are a safe runner foundation. The endpoint is manually triggered, returns a structured evaluation result, and does not crawl websites, create vacancy matches, score records, deduplicate records, or deploy a scheduler. No run history is persisted.

The runner considers Loop `selected_sources`. A source can only call a source adapter when it exists in the Discovery Source Registry, is enabled, and has `capabilities.automatic_discovery = true`. Registry sources still keep `automatic_discovery = false` unless a safe source adapter is explicitly implemented and enabled, so normal runs return skipped source items instead of fetching anything.

`last_discovery_at` is not updated when all sources are skipped. This avoids recording misleading discovery timestamps.

F37 adds a backend source adapter interface and dry-run preview response shape. The built-in `manual_url` adapter is architecture-only and performs no network access; it is not runnable from discovery runs while the registry keeps `manual_url.capabilities.automatic_discovery = false`. Real source adapters remain opt-in and must respect safety limits.

F38 adds the first safe external adapter for `arbeitsagentur`. It uses the public Jobsuche JSON endpoint documented by the bundesAPI mirror:

- `GET https://rest.arbeitsagentur.de/jobboerse/jobsuche-service/pc/v4/jobs`
- request header `X-API-Key: jobboerse-jobsuche`
- query fields `was`, `wo`, `umkreis`, `page`, `size`, `pav`, and `angebotsart`

The current safe adapter set is intentionally split by source:

- `arbeitsagentur`: public Jobsuche JSON endpoint, tiny dry-run result limit.
- `arbeitnow`: public Europe/remote jobs API, no credentials, preview-only.
- `adzuna`: official Adzuna Germany API. It is runnable only when server-side
  `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` are configured; otherwise it returns
  `adzuna_not_configured`.
- `remotive`: public Remotive remote jobs API, no credentials, keyword based.
- `remotejobs`: public RemoteJobs.org API, no credentials, keyword based.
- `himalayas`: public Himalayas Remote Jobs API, no credentials, keyword based.
- `remoteok`: public Remote OK JSON feed, no credentials, filtered in the
  adapter and returned with direct source links.
- `greenhouse`: public Greenhouse Job Board API for configured company board
  tokens from `GREENHOUSE_BOARD_TOKENS`; without tokens it returns
  `greenhouse_not_configured`.
- `lever`: public Lever Postings API for configured company site names from
  `LEVER_SITE_NAMES`; without sites it returns `lever_not_configured`.

This adapter is dry-run oriented. It limits responses to 5 preview items per source per page, does not call detail endpoints, does not scrape HTML, does not use browser automation, and does not persist results.

Search phrase behavior stays bounded:

- `arbeitsagentur`, `remotive`, `remotejobs`, `himalayas`, and configured `adzuna` may try a tiny set of
  broader fallback phrases when the first phrase is too narrow.
- in `broad` mode, `arbeitsagentur` may also try one bounded fallback without
  the Loop location after location-specific queries.
- `arbeitnow` is page-based rather than search-based, so it may inspect a tiny
  fixed source-page window for the requested preview page before returning at
  most five matching preview items.
- fallback phrases reuse the same source, page, timeout, and five-item page
  size; they are not a crawler or scheduler.
- `greenhouse` and `lever` read only configured company boards/sites and use the
  configured board token or site name as a company fallback when the source
  payload does not include a company name.
- adapter results are deduplicated inside the adapter where a source can return
  the same posting more than once.

### POST /discovery-runs

```
POST /api/v1/discovery-runs
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "dry_run": true,
  "source_ids": ["arbeitsagentur", "remotive"],
  "search_scope": "broad",
  "page": 1,
  "page_size": 5
}
```

Fields:

- `loop_id`: optional. When present, evaluates only that current-user Loop. When omitted, evaluates active current-user Loops with `auto_discovery_enabled = true`.
- `dry_run`: optional, defaults to `true`. F23 does not create vacancy matches even when `false`.
- `source_ids`: optional. When omitted, the runner evaluates the Loop's `selected_sources`.
- `search_scope`: optional, defaults to `normal`. Allowed values are `focused`, `normal`, and `broad`. The Matches preview UI uses `broad` by default so public job APIs do not become too narrow when a Loop has several keywords.
- `page`: optional, defaults to `1`. Used by the Matches feed to request the next safe preview page.
- `page_size`: optional, defaults to `5`, maximum `5`. Each source returns at most five preview items per page.
- Each response item includes `has_more`. When `true`, the client may request the next page for that same source. The Matches UI also stops pagination when the next page contains only duplicate preview items.
- The Matches UI source cards also show the current preview count per source,
  how many preview items are new vs already saved, and whether another page may
  be available.
- The Matches UI hides already saved preview items by default. This is a client
  presentation filter only; it does not delete preview results, persist data, or
  create Applications.
- The Matches UI also supports `Не интересно` for individual preview cards.
  This creates a preview ignore record through
  `POST /loops/{loop_id}/matches/preview-ignores`. It is not a Vacancy Match,
  does not update `last_discovery_at`, and does not create an Application.

**Response 200:**
```json
{
  "run_id": "f8b2f932-9b83-4a6b-90e8-6bd41fc688b1",
  "status": "completed_with_warnings",
  "dry_run": true,
  "page": 1,
  "page_size": 5,
  "loops_checked": 1,
  "sources_checked": 0,
  "matches_created": 0,
  "matches_previewed": 0,
  "warnings": [
    "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0:stepstone:automatic_discovery_not_available"
  ],
  "items": [
    {
      "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
      "source_id": "stepstone",
      "status": "skipped",
      "reason": "automatic_discovery_not_available",
      "message": "Automatic discovery is not available for this source.",
      "items_previewed": 0,
      "has_more": false,
      "preview_items": [],
      "warnings": [],
      "errors": []
    }
  ]
}
```

Common item reasons:

- `no_sources_selected`: the Loop has no selected discovery sources.
- `source_not_found`: the Loop references a source id missing from the registry.
- `source_disabled`: the registry source is disabled.
- `automatic_discovery_not_available`: the source is known but not runnable.
- `source_adapter_not_implemented`: the source is marked runnable, but no safe adapter is registered.
- `adapter_preview_ready`: a safe adapter returned preview items and no records were created.
- `automatic_match_persistence_not_enabled`: a non-dry-run request was received, but F37 still keeps match persistence disabled.
- `source_adapter_failed`: an adapter failed and the runner returned a safe error item without leaking internals.
- `arbeitsagentur_requires_search_terms`: the Arbeitsagentur adapter was called without role, keywords, or location.
- `arbeitnow_requires_search_terms`: the Arbeitnow adapter was called without role or keywords.
- `adzuna_not_configured`: Adzuna keys are not configured server-side.
- `adzuna_requires_search_terms`: the Adzuna adapter was called without role, keywords, or location.
- `remotive_requires_search_terms`: the Remotive adapter was called without role or keywords.
- `remotejobs_requires_search_terms`: the RemoteJobs.org adapter was called without role or keywords.
- `greenhouse_not_configured`: no Greenhouse board tokens are configured.
- `lever_not_configured`: no Lever site names are configured.
- `loop_not_eligible`: the Loop is not active.

Preview item fields:

- `external_id`
- `source_url`
- `title`
- `company`
- `location`
- `snippet`
- `posted_at`
- `raw_metadata`
- `confidence`

Safety boundaries:

- source adapters do not create Applications.
- dry runs never persist Vacancy Matches.
- non-dry-run persistence remains disabled in F37 and returns `automatic_match_persistence_not_enabled`.
- adapters receive a small per-source result limit and request timeout.
- no credentials, login flow, browser automation, or unbounded pagination is part of the adapter contract.
- only the reviewed safe adapters are currently marked runnable:
  `arbeitsagentur`, `arbeitnow`, `adzuna`, `remotive`, `remotejobs`, `himalayas`, `remoteok`, `greenhouse`, and `lever`.
  StepStone, Indeed, LinkedIn, XING, manual URL, and broad company website
  sources remain registry-only for discovery runs.

## Matches Feed Product Contract

`/dashboard/matches` is the product surface for incoming vacancy candidates.
It helps the user review opportunities before they become tracked applications.

Current safe workflow:

1. The user opens a Loop or the matches page.
2. The user explicitly runs or opens a bounded preview for supported safe
   sources selected in a Loop. Today the runnable adapter ids are
   `arbeitsagentur`, `arbeitnow`, `adzuna`, `remotive`, `remotejobs`, `himalayas`, `remoteok`, `greenhouse`, and `lever`.
3. The backend returns Discovery Preview Items. These are temporary and are not
   saved automatically.
4. The user chooses one item and saves it as a Vacancy Match through
   `POST /api/v1/loops/{loop_id}/matches/from-preview`.
5. The saved match can be analyzed, ignored, or converted by explicit action.
6. The user creates an Application only through
   `POST /api/v1/loops/{loop_id}/matches/{match_id}/create-application`.

Product boundaries:

- `/dashboard/matches` is not a job-board crawler.
- It must not imply that StepStone, Indeed, LinkedIn, or XING are connected for
  automatic source execution.
- It must not create Applications automatically.
- It must not submit anything to external employers.
- It must not bulk-save preview results.
- A scheduled background refresh is future work and requires separate safety
  review, logging, limits, deduplication, and source controls.

Expected future direction:

- `/dashboard/matches` becomes the central feed for saved Vacancy Matches and
  later safe refreshed candidates.
- Source adapters are enabled one at a time after review.
- Users can save, ignore, analyze, and convert selected items.
- Applications remain the user's own tracked application records, created only
  after an explicit user action.

### GET /loops

List current user's Loops. Archived Loops are excluded by default.

```
GET /api/v1/loops?include_archived=false&limit=50&offset=0
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "items": [
    {
      "id": "6f2b7d7c-6fb0-4f11-a0d4-9cbb840dfc40",
      "user_id": "2c7eb1d4-5fae-442a-9bcb-6510f9458b73",
      "title": "Ausbildung IT Bremen",
      "target_role": "Fachinformatiker Anwendungsentwicklung",
      "location": "Bremen",
      "radius_km": 50,
      "sources": ["company_site"],
      "keywords": ["React", "TypeScript"],
      "excluded_keywords": ["Senior"],
      "employment_types": ["ausbildung"],
      "work_modes": ["hybrid"],
      "selected_sources": ["stepstone", "company_site"],
      "auto_discovery_enabled": false,
      "discovery_radius_km": 50,
      "last_discovery_at": null,
      "status": "active",
      "created_at": "2026-05-13T10:00:00Z",
      "updated_at": "2026-05-13T10:00:00Z"
    }
  ],
  "total": 1,
  "limit": 50,
  "offset": 0
}
```

### POST /loops

Create a backend-owned Loop for the current user.

```
POST /api/v1/loops
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "title": "Ausbildung IT Bremen",
  "target_role": "Fachinformatiker Anwendungsentwicklung",
  "location": "Bremen",
  "radius_km": 50,
  "sources": ["company_site"],
  "keywords": ["React", "TypeScript"],
  "excluded_keywords": ["Senior"],
  "employment_types": ["ausbildung"],
  "work_modes": ["hybrid"],
  "selected_sources": ["stepstone", "company_site"],
  "auto_discovery_enabled": false,
  "discovery_radius_km": 50,
  "status": "active"
}
```

### GET /loops/{loop_id}

Returns one current-user-owned Loop. Other users' Loops return 404.

### PATCH /loops/{loop_id}

Updates editable Loop fields: `title`, `target_role`, `location`, `radius_km`, `sources`, `status`, `keywords`, `excluded_keywords`, `employment_types`, `work_modes`, `selected_sources`, `auto_discovery_enabled`, and `discovery_radius_km`. `last_discovery_at` is read-only and cannot be patched through the public API.

### DELETE /loops/{loop_id}

Soft archives a Loop by setting `status = "archived"`.

## Loop Vacancy Matches

Vacancy matches are discovered or saved vacancies inside a `Loop`. Import by URL is loop-centered: one user-provided URL is previewed, the user saves it as a match, and only a separate explicit conversion creates an application.

Constraints remain MVP-safe:

- no mass scraping or crawling
- no automatic collection of HR contacts, emails, or phone numbers
- no login/captcha/robots/anti-bot/paywall bypass
- preview does not save data
- saving a match does not create an application
- conversion creates an application with `loop_id = match.loop_id` and `has_loop = true`

Supported match statuses: `new`, `saved`, `ignored`, `converted`.

### POST /loops/{loop_id}/matches/import-preview

Preview one user-provided vacancy URL for a specific Loop. This delegates to the vacancy import preview service and does not store anything.

```
POST /api/v1/loops/{loop_id}/matches/import-preview
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "url": "https://example.com/careers/frontend-developer"
}
```

**Response 200:** Same shape as `POST /vacancy-import/preview`.

### POST /loops/{loop_id}/matches

Save an editable preview as a vacancy match under the Loop. This does not create an application.

```
POST /api/v1/loops/{loop_id}/matches
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "source_url": "https://example.com/careers/frontend-developer",
  "source": "example.com",
  "external_id": null,
  "company_name": "Example GmbH",
  "role_title": "Frontend Developer",
  "location_text": "Berlin",
  "vacancy_description": "Build user interfaces with TypeScript.",
  "raw_metadata": {},
  "confidence": { "role_title": 0.95 },
  "warnings": [],
  "status": "saved"
}
```

### POST /loops/{loop_id}/matches/from-preview

Save one selected discovery preview item as a persisted vacancy match. This endpoint requires an explicit user action, validates Loop ownership and the source registry, normalizes `source_url`, and deduplicates inside the Loop before creating anything. It creates only a vacancy match; it does not create an application, update `last_discovery_at`, save all preview items, or start scheduled work.

```
POST /api/v1/loops/{loop_id}/matches/from-preview
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "source_id": "arbeitsagentur",
  "external_id": "10000-1234567890-S",
  "source_url": "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1234567890-S",
  "title": "Backend Developer",
  "company": "Example GmbH",
  "location": "Berlin",
  "description": "Build APIs with Python.",
  "posted_at": "2026-05-15",
  "raw_metadata": { "refnr": "10000-1234567890-S" },
  "confidence": { "source_quality": 0.95 }
}
```

**Response 201:**
```json
{
  "match": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
    "source_url": "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1234567890-S",
    "source": "arbeitsagentur",
    "external_id": "10000-1234567890-S",
    "company_name": "Example GmbH",
    "role_title": "Backend Developer",
    "location_text": "Berlin",
    "vacancy_description": "Build APIs with Python.",
    "raw_metadata": { "refnr": "10000-1234567890-S" },
    "confidence": { "source_quality": 0.95 },
    "warnings": [],
    "status": "saved",
    "application_id": null,
    "created_at": "2026-05-15T10:00:00Z",
    "updated_at": "2026-05-15T10:00:00Z"
  },
  "created": true,
  "duplicate": false
}
```

If a match already exists for the same `loop_id + source_id + external_id`, or for the same normalized `source_url` inside the Loop/source, the endpoint returns the existing match with `created=false` and `duplicate=true`. Existing matches are not overwritten or merged.

### POST /loops/{loop_id}/matches/preview-ignores

Persist a user decision to hide one discovery preview item from future Matches
preview feeds. This endpoint requires an explicit user action. It validates Loop
ownership and source id, normalizes `source_url`, and deduplicates by
`loop_id + source_id + external_id` or normalized `source_url`.

It creates only a preview ignore record. It does not create a Vacancy Match,
does not create an Application, does not update `last_discovery_at`, and does
not start scheduled work.

```
POST /api/v1/loops/{loop_id}/matches/preview-ignores
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "source_id": "arbeitsagentur",
  "external_id": "10000-1234567890-S",
  "source_url": "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1234567890-S",
  "title": "Backend Developer",
  "company": "Example GmbH"
}
```

**Response 201:**
```json
{
  "item": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
    "source_id": "arbeitsagentur",
    "external_id": "10000-1234567890-S",
    "source_url": "https://www.arbeitsagentur.de/jobsuche/jobdetail/10000-1234567890-S",
    "title": "Backend Developer",
    "company": "Example GmbH",
    "created_at": "2026-05-18T10:00:00Z",
    "updated_at": "2026-05-18T10:00:00Z"
  },
  "created": true,
  "duplicate": false
}
```

Duplicate ignores return the existing item with `created=false` and
`duplicate=true`.

### GET /loops/{loop_id}/matches/preview-ignores

List current-user preview ignore records for one Loop. The Matches UI uses this
to hide previously dismissed preview items when the page opens or the Loop
filter changes.

```
GET /api/v1/loops/{loop_id}/matches/preview-ignores?limit=200&offset=0
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "items": [],
  "total": 0,
  "limit": 200,
  "offset": 0
}
```

### DELETE /loops/{loop_id}/matches/preview-ignores/{ignore_id}

Remove one preview ignore record so the item can appear in future preview feeds
again. This endpoint deletes only the ignore record. It does not create or
modify Vacancy Matches or Applications.

```
DELETE /api/v1/loops/{loop_id}/matches/preview-ignores/{ignore_id}
Authorization: Bearer <token>
```

**Response 204:** no body.

**Response 404:** ignore record not found or belongs to another user/Loop.

### GET /loops/{loop_id}/matches

List matches for the current user and the selected Loop. Returns a paginated envelope.

```
GET /api/v1/loops/{loop_id}/matches?status=saved&limit=20&offset=0
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "items": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

### PATCH /loops/{loop_id}/matches/{match_id}

Edit mutable match fields only: `company_name`, `role_title`, `location_text`, `vacancy_description`, `status`. Direct edits to `user_id`, `loop_id`, or `application_id` are not allowed.

### POST /loops/{loop_id}/matches/{match_id}/evaluate

Compute deterministic scoring and advisory duplicate metadata for one saved vacancy match. The endpoint is read-only: it does not update the match, create an application, merge duplicates, delete records, call external services, or use AI.

Scoring range is `0..100`. The score is deterministic and explainable. Current dimensions:

- `title_match_score`: overlap between the Loop target role and match role title.
- `location_match_score`: Loop location matched against match location text.
- `keyword_score`: Loop keywords found in the title, company, location, or description.
- `excluded_keyword_penalty`: Loop excluded keywords found in the same searchable text.
- `source_score`: match source appears in Loop `selected_sources`.
- `employment_type_match_score` and `work_mode_match_score`: reserved as `0` until vacancy matches expose those fields.

Deduplication is advisory only. Duplicate statuses:

- `none`
- `possible_duplicate`
- `likely_duplicate`
- `exact_duplicate`

Duplicate signals:

- same normalized source URL
- same company, title, and source as another vacancy match
- same company, title, and location as another vacancy match
- same normalized source URL as an existing application
- same company and title as an existing application
- match already linked to an application

```
POST /api/v1/loops/{loop_id}/matches/{match_id}/evaluate
Authorization: Bearer <token>
```

**Response 200:**
```json
{
  "match_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "total_score": 72,
  "title_match_score": 25,
  "location_match_score": 10,
  "employment_type_match_score": 0,
  "work_mode_match_score": 0,
  "keyword_score": 20,
  "excluded_keyword_penalty": 0,
  "source_score": 15,
  "reasons": [
    "Role title matches Loop target terms: backend, engineer.",
    "Matched keyword: Python.",
    "Source is selected for this Loop."
  ],
  "penalties": [],
  "duplicate_status": "possible_duplicate",
  "duplicate_of_match_id": null,
  "duplicate_application_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "duplicate_reasons": [
    "Same company and title as an existing application."
  ]
}
```

**Response 404:** vacancy match not found in the current user's Loop.

### POST /loops/{loop_id}/matches/{match_id}/analyses

Create and save a vacancy/resume analysis for one saved match. `basic` analysis
always uses the deterministic provider. `ai` analysis uses the configured
provider: deterministic by default, or optional local Ollama when
`AI_ANALYSIS_PROVIDER=ollama`.

Raw `resume_text` is required for the request, is hashed as `resume_hash`, and
is not stored.

**Request:**
```json
{
  "analysis_type": "basic",
  "resume_text": "Resume text pasted by the user",
  "language": "ru",
  "include_cover_letter": false,
  "include_interview_questions": false
}
```

**Response 201:**
```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "match_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "analysis_type": "basic",
  "provider": "deterministic",
  "model": "deterministic-v1",
  "plan": "free",
  "resume_hash": "sha256...",
  "vacancy_snapshot": {
    "role_title": "Backend Engineer",
    "company_name": "Acme GmbH"
  },
  "overall_score": 72,
  "summary": "Deterministic analysis summary.",
  "strengths": [],
  "gaps": [],
  "risks": [],
  "recommended_cv_keywords": [],
  "application_angle": "Position the application around concrete fit.",
  "cover_letter_draft": null,
  "interview_questions": [],
  "model_info": {
    "provider": "deterministic",
    "mode": "deterministic",
    "external_call": false
  },
  "quota_day": "2026-05-14",
  "quota": {
    "plan": "free",
    "basic_used": 1,
    "basic_limit": 10,
    "ai_used": 0,
    "ai_limit": 1,
    "day": "2026-05-14"
  },
  "created_at": "2026-05-14T12:00:00Z"
}
```

**Plan policy:**

| Plan | Basic analyses/day | AI analyses/day | Cover letter | Interview questions | Priority |
|---|---:|---:|---|---|---|
| `free` | 10 | 1 | short template only | no | normal |
| `basic` | 100 | 50 | yes | yes | normal |
| `premium` | 300 | 100 | yes | yes | high |

The plan is resolved from `users.analysis_plan`. New users default to `free`.
There is no payment provider or public self-upgrade endpoint yet; admin/dev plan
assignment stays outside the public API.

Quota exceeded returns `429 ANALYSIS_QUOTA_EXCEEDED`. Plan-restricted options
return `403 ANALYSIS_FEATURE_UNAVAILABLE`.

Provider errors are safe and do not persist a successful analysis:

| Error code | Status | Meaning |
|---|---:|---|
| `AI_PROVIDER_UNAVAILABLE` | 503 | Configured local provider cannot be reached. |
| `AI_PROVIDER_TIMEOUT` | 504 | Configured local provider timed out. |
| `AI_PROVIDER_INVALID_RESPONSE` | 502 | Provider response was not valid analysis JSON. |
| `AI_PROVIDER_NOT_CONFIGURED` | 503 | Provider settings are incomplete or unsupported. |

When `AI_ANALYSIS_PROVIDER=ollama`, resume/vacancy text is sent to the configured
local Ollama endpoint for this request. Raw resume text is still not stored.

### GET /loops/{loop_id}/matches/{match_id}/analyses

Return saved analysis history for a match.

### GET /loops/{loop_id}/matches/{match_id}/analyses/latest

Return the latest saved analysis for a match. Returns 404 when no analysis is
saved yet.

### POST /loops/{loop_id}/matches/{match_id}/create-application

Explicitly create an application from a saved match. The match must belong to the current user and the path `loop_id`. Ignored matches must be restored first. `company_name` and `role_title` are required.

This endpoint runs only after a user action. It does not submit anything to an external employer, does not run discovery, does not update `last_discovery_at`, and does not convert other matches.

**Request body:**
```json
{
  "status": "SAVED",
  "notes": "Optional note",
  "favorite": false
}
```

**Response 200:**
```json
{
  "application": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "loop_id": "loop-1",
    "company_name": "Example GmbH",
    "role_title": "Backend Engineer",
    "vacancy_url": "https://example.com/job",
    "status": "SAVED"
  },
  "match": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "loop_id": "loop-1",
    "status": "converted",
    "application_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  },
  "created": true,
  "already_linked": false
}
```

Idempotency behavior: if the match is already `converted` and has an existing `application_id` owned by the user, the endpoint returns that existing application and match with `created=false` and `already_linked=true`. No duplicate application is created.

### POST /loops/{loop_id}/matches/{match_id}/convert-to-application

Legacy compatibility endpoint for creating an application from a match. Prefer `POST /loops/{loop_id}/matches/{match_id}/create-application` for new clients.

Idempotency behavior: if the match is already `converted` and has an existing `application_id` owned by the user, the endpoint returns that existing application id and match instead of creating a duplicate.

**Response 200:**
```json
{
  "application_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "match": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "loop_id": "loop-1",
    "status": "converted",
    "application_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6"
  }
}
```

---

## Applications

### Enum reference

**ProcessStatus** — valid values for the `status` field:

| Value | Meaning |
|---|---|
| `SAVED` | Saved for later, not yet applied |
| `PLANNED` | Planning to apply |
| `APPLIED` | Submission sent |
| `VIEWED` | Company viewed the application |
| `INTERVIEW_1` | First interview stage |
| `INTERVIEW_2` | Second interview stage |
| `TEST_TASK` | Test task / assignment |
| `OFFER` | Job offer received |
| `REJECTED` | Application rejected |
| `NO_RESPONSE` | No response from company |
| `WITHDREW` | Applicant withdrew |

**EmploymentType:** `FULL_TIME` | `PART_TIME` | `CONTRACT`

**WorkMode:** `REMOTE` | `HYBRID` | `ON_SITE`

**AppliedVia:** `company_site` | `linkedin` | `indeed` | `stepstone` | `email` | `referral` | `other`

---

### Derived (server-computed) fields

These fields are recomputed on every create/update and **cannot be sent in request bodies**:

| Field | Computed from | Stored in DB |
|---|---|---|
| `stage` | `status` — see table below | ✅ (indexable) |
| `needs_follow_up` | `status`, `last_contact_at`, `follow_up_level` | ✅ |
| `follow_up_due_at` | `last_contact_at` + follow-up days by level | ✅ |
| `needs_reapply_suggestion` | `status` in {REJECTED, NO_RESPONSE} and `applied_at` | ✅ |
| `reapply_eligible_at` | `applied_at` + 90 days | ✅ |
| `last_status_change_at` | Set by the service on every status change | ✅ |
| `days_in_pipeline` | `floor((now_utc − created_at) / 86400)` | ❌ serialization only |
| `days_since_applied` | `floor((now_utc − applied_at) / 86400)`, null if `applied_at` is null | ❌ serialization only |
| `days_in_current_status` | `floor((now_utc − last_status_change_at) / 86400)` | ❌ serialization only |

**Age fields** (`days_*`) are appended to every `ApplicationRead` response. Use them for UI labels such as *"4 days in pipeline"* or *"waiting 12 days"*. They are computed at response time from UTC timestamps; do not store them on the frontend.

**Stage mapping:**

| Status | Stage |
|---|---|
| SAVED, PLANNED, APPLIED, VIEWED | `ACTIVE` |
| INTERVIEW_1, INTERVIEW_2, TEST_TASK | `INTERVIEW` |
| OFFER | `OFFER` |
| REJECTED | `REJECTED` |
| NO_RESPONSE | `NO_RESPONSE` |
| WITHDREW | `ARCHIVED` |

**Follow-up schedule** (days since `last_contact_at` by `follow_up_level`):

| Level | Days |
|---|---|
| 0 | 3 |
| 1 | 7 |
| 2 | 14 |
| 3+ | 21 |

Follow-up tracking only applies to statuses: `APPLIED`, `VIEWED`, `INTERVIEW_1`, `INTERVIEW_2`, `TEST_TASK`.

---

### GET /applications

List applications for the current user. Returns a paginated envelope — never a bare array.

```
GET /api/v1/applications
Authorization: Bearer <token>
```

**Query parameters:**

| Param | Type | Default | Constraints | Description |
|---|---|---|---|---|
| `archived` | bool | `false` | — | `false` = active only; `true` = archived only |
| `status` | string | — | valid `ProcessStatus` | Comma-separated values (e.g. `APPLIED,INTERVIEW_1`) |
| `stage` | string | — | valid stage | Filter by computed stage (`ACTIVE`, `INTERVIEW`, `OFFER`, `REJECTED`, `NO_RESPONSE`, `ARCHIVED`) |
| `search` | string | — | — | Case-insensitive substring match over `company_name`, `role_title`, `location_text`, `source` |
| `loop_id` | UUID | — | existing loop id | Filter by source loop |
| `is_favorite` | bool | — | — | Filter favorite/non-favorite applications |
| `limit` | int | `20` | 1–100 | Items per page |
| `offset` | int | `0` | ≥ 0 | Items to skip |
| `sort` | enum | `updated_at_desc` | see below | Sort order |

**Sort values:**

| Value | Meaning |
|---|---|
| `updated_at_desc` *(default)* | Most recently touched first |
| `updated_at_asc` | Least recently touched first |
| `created_at_desc` | Newest first |
| `created_at_asc` | Oldest first |
| `last_status_change_at_desc` | Most recently transitioned first |
| `last_status_change_at_asc` | Least recently transitioned first |

Invalid `sort` values return `422`.

**Filtering, sorting, and counting all happen in SQL** — no post-fetch filtering.

**Response 200 — envelope:**
```json
{
  "items": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
      "archived": false,
      "is_favorite": false,
      "company_name": "Acme Corp",
      "role_title": "Senior Frontend Engineer",
      "location_text": "Berlin, Germany",
      "vacancy_url": "https://acme.com/jobs/123",
      "source": "LinkedIn",
      "employment_type": "FULL_TIME",
      "work_mode": "HYBRID",
      "salary": { "currency": "EUR", "min": 80000, "max": 100000 },
      "posted_at": "2024-01-10T00:00:00Z",
      "status": "APPLIED",
      "stage": "ACTIVE",
      "sub_status": null,
      "last_status_change_at": "2024-01-12T14:30:00Z",
      "applied_at": "2024-01-12T14:00:00Z",
      "applied_via": "linkedin",
      "next_action_at": "2024-01-19T09:00:00Z",
      "next_action_text": "Follow up if no reply",
      "contact_attempts": 1,
      "last_contact_at": "2024-01-12T14:00:00Z",
      "last_follow_up_at": null,
      "follow_up_level": 0,
      "needs_follow_up": false,
      "follow_up_due_at": "2024-01-15T14:00:00Z",
      "needs_reapply_suggestion": false,
      "reapply_eligible_at": null,
      "reapply_reason": null,
      "reminders": [
        { "id": "r1", "at": "2024-01-19T09:00:00Z", "text": "Send follow-up email" }
      ],
      "current_note": "Referral from John",
      "tags": ["react", "typescript"],
      "vacancy_description": null,
      "role_fingerprint": null,
      "loop_id": null,
      "has_loop": false,
      "cv_version_id": null,
      "profile_version_id": null,
      "created_at": "2024-01-12T13:55:00Z",
      "updated_at": "2024-01-12T14:30:00Z",
      "days_in_pipeline": 14,
      "days_since_applied": 12,
      "days_in_current_status": 12
    }
  ],
  "total": 142,
  "limit": 20,
  "offset": 0
}
```

`total` is the count of all matching records for the applied filters, regardless of `limit`/`offset`. Use it to compute page count: `ceil(total / limit)`.

`days_*` are derived at response time (not stored). Use them for UI labels such as *"4 days in pipeline"*. They are always ≥ 0. `days_since_applied` is `null` when `applied_at` is null.

---

### POST /applications

Create a new application.

```
POST /api/v1/applications
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body** (`loop_id`, `company_name`, and `role_title` are required by backend service rules; all others optional):
```json
{
  "loop_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
  "company_name": "Acme Corp",
  "role_title": "Senior Frontend Engineer",
  "location_text": "Berlin, Germany",
  "vacancy_url": "https://acme.com/jobs/123",
  "source": "LinkedIn",
  "employment_type": "FULL_TIME",
  "work_mode": "HYBRID",
  "salary": { "currency": "EUR", "min": 80000, "max": 100000 },
  "posted_at": "2024-01-10T00:00:00Z",
  "status": "SAVED",
  "is_favorite": false,
  "sub_status": null,
  "applied_at": null,
  "applied_via": null,
  "next_action_at": null,
  "next_action_text": null,
  "contact_attempts": 0,
  "last_contact_at": null,
  "follow_up_level": 0,
  "reminders": null,
  "current_note": null,
  "tags": ["react", "typescript"],
  "vacancy_description": null,
  "loop_id": null,
  "has_loop": false,
  "cv_version_id": null,
  "profile_version_id": null
}
```

**Response 201:** Full `ApplicationRead` object (same shape as the list item above).

**Validation:** Extra fields are rejected with `422`. `company_name` and `role_title` cannot be null or empty. `loop_id`, `company_name`, and `role_title` are required. `has_loop` is set by the backend from `loop_id`.

---

### GET /applications/{app_id}

Get a single application by ID.

```
GET /api/v1/applications/{app_id}
Authorization: Bearer <token>
```

**Response 200:** Full `ApplicationRead` object.

**Response 404:** Application not found or belongs to another user.

---

### PATCH /applications/{app_id}

Update mutable fields on an application. All fields are optional; omitted fields are left unchanged. Derived fields are recomputed automatically.

```
PATCH /api/v1/applications/{app_id}
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body** (all fields optional):
```json
{
  "company_name": "Acme Corp",
  "role_title": "Lead Engineer",
  "location_text": "Remote",
  "vacancy_url": "https://acme.com/jobs/456",
  "source": null,
  "employment_type": "FULL_TIME",
  "work_mode": "REMOTE",
  "salary": { "currency": "EUR", "min": 90000, "max": 110000 },
  "posted_at": null,
  "status": "INTERVIEW_1",
  "is_favorite": true,
  "sub_status": null,
  "applied_at": "2024-01-12T14:00:00Z",
  "applied_via": "linkedin",
  "next_action_at": "2024-01-20T10:00:00Z",
  "next_action_text": "Prepare for interview",
  "contact_attempts": 2,
  "last_contact_at": "2024-01-15T10:00:00Z",
  "last_follow_up_at": null,
  "follow_up_level": 1,
  "reapply_reason": null,
  "reminders": [],
  "current_note": "Interview with team lead",
  "tags": ["react"],
  "vacancy_description": null,
  "loop_id": null,
  "has_loop": false,
  "cv_version_id": null,
  "profile_version_id": null,
  "archived": false
}
```

**Response 200:** Updated `ApplicationRead` object.

**Tags:** `tags` is a simple string array on the application. Removing a tag is done by sending the replacement array, for example `{ "tags": ["react"] }`. The backend trims empty tags and removes duplicate values case-insensitively.

**Favorites:** `is_favorite` can be changed via PATCH. No separate favorite endpoints are required.

**Read-only fields** (not accepted in PATCH body): `id`, `user_id`, `stage`, `needs_follow_up`, `follow_up_due_at`, `needs_reapply_suggestion`, `reapply_eligible_at`, `last_status_change_at`, `created_at`, `updated_at`, `role_fingerprint`.

**Response 404:** Application not found or belongs to another user.

> Archiving via PATCH: you can set `"archived": true` in a PATCH body as a convenience alternative to calling DELETE.

---

### POST /applications/{app_id}/status

Change the application status. Recomputes all derived fields (`stage`, `needs_follow_up`, etc.) server-side.

```
POST /api/v1/applications/{app_id}/status
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "to_status": "INTERVIEW_1",
  "sub_status": null,
  "comment": null,
  "correlation_id": null
}
```

| Field | Required | Notes |
|---|---|---|
| `to_status` | Yes | Any valid `ProcessStatus` value |
| `sub_status` | No | Arbitrary string for sub-categorisation |
| `comment` | No | Stored in the `STATUS_CHANGE` history entry's `comment` field |
| `correlation_id` | No | Stored in the `STATUS_CHANGE` history entry's `correlation_id` field |

**Response 200:** Updated `ApplicationRead` object.

**Response 404:** Application not found or belongs to another user.

**Validation:** Extra fields are rejected with `422`.

---

### DELETE /applications/{app_id}

Soft-delete (archive) an application. Sets `archived=true`. The record is not destroyed and remains queryable via `GET /applications?archived=true`.

```
DELETE /api/v1/applications/{app_id}
Authorization: Bearer <token>
```

**Response 204:** No body.

**Response 404:** Application not found or belongs to another user.

---

## History and Comments

### GET /applications/{app_id}/history

List history events for an application, newest first.

```
GET /api/v1/applications/{app_id}/history?limit=20&offset=0&type=COMMENT
Authorization: Bearer <token>
```

**Query parameters:**

| Param | Type | Default | Range | Description |
|---|---|---|---|---|
| `limit` | int | `20` | 1–100 | Maximum number of items to return |
| `offset` | int | `0` | ≥ 0 | Number of history items to skip |
| `type` | enum | — | see below | Optional event type filter |

**History type filter values:**

`APPLICATION_CREATED`, `STATUS_CHANGE`, `FIELD_CHANGE`, `COMMENT`, `APPLICATION_ARCHIVED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`.

**Response 200:**
```json
{
  "items": [
    {
      "id": "a1b2c3d4-...",
      "application_id": "3fa85f64-...",
      "user_id": "7c9e6679-...",
      "actor": "user",
      "type": "COMMENT",
      "from_status": null,
      "to_status": null,
      "field_path": null,
      "old_value": null,
      "new_value": null,
      "comment": "Had a great call with the hiring manager.",
      "feedback_type": "positive",
      "sentiment": "positive",
      "rejection_reason_code": null,
      "correlation_id": null,
      "created_at": "2024-01-16T11:00:00Z"
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

`total` is the count of all matching history rows for the applied `type` filter.

**Response 404:** Application not found or belongs to another user.

---

### POST /applications/{app_id}/comments

Add a comment to an application. Automatically creates an activity feed event.

```
POST /api/v1/applications/{app_id}/comments
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "text": "Had a great call with the hiring manager.",
  "feedback_type": "positive",
  "sentiment": "positive",
  "rejection_reason_code": null,
  "correlation_id": null
}
```

> **Important:** The comment body field is `"text"`, not `"comment"`.

| Field | Required | Description |
|---|---|---|
| `text` | Yes | The comment text |
| `feedback_type` | No | Free-form feedback classification |
| `sentiment` | No | Free-form sentiment label |
| `rejection_reason_code` | No | Machine-readable rejection reason |
| `correlation_id` | No | Link to a related event |

**Response 201:** `HistoryItemRead` object (same shape as an item in the history list).

**Response 404:** Application not found or belongs to another user.

**Validation:** Extra fields are rejected with `422`.

---

## Activity Feed

### GET /activity/feed

Return recent activity events for the current user across all applications.

```
GET /api/v1/activity/feed?limit=50
Authorization: Bearer <token>
```

**Query parameters:**

| Param | Type | Default | Range | Description |
|---|---|---|---|---|
| `limit` | int | `50` | 1–100 | Maximum number of events to return |
| `kind` | string | — | — | Filter by event kind (e.g. `comment_added`, `status_changed`) |

**History type filter values:**

`APPLICATION_CREATED`, `STATUS_CHANGE`, `FIELD_CHANGE`, `COMMENT`, `APPLICATION_ARCHIVED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`.

**Response 200:**
```json
{
  "items": [
    {
      "id": "e1f2a3b4-...",
      "user_id": "7c9e6679-...",
      "application_id": "3fa85f64-...",
      "kind": "comment_added",
      "title": "Comment added to Acme Corp – Senior Frontend Engineer",
      "description": null,
      "payload": {},
      "created_at": "2024-01-16T11:00:00Z"
    }
  ]
}
```

**Automatically generated activity events:**

| Action | `kind` |
|---|---|
| `POST /applications/{id}/comments` | `COMMENT_ADDED` |
| `POST /applications/{id}/status` | `STATUS_CHANGED` |
| `PATCH /applications/{id}` | `APPLICATION_UPDATED` |

---

## Analytics

### GET /analytics/kpi

KPI summary for the current user's applications within a time window.

```
GET /api/v1/analytics/kpi?range=30d
Authorization: Bearer <token>
```

**Query parameters:**

| Param | Type | Default | Allowed values |
|---|---|---|---|
| `range` | string | `30d` | `7d` \| `30d` \| `90d` \| `all` |

The `range` filter applies to `created_at` (the date the application record was created).

**Response 200:**
```json
{
  "range": "30d",
  "total_applications": 42,
  "active_applications": 35,
  "archived_applications": 7,
  "status_counts": {
    "SAVED": 5,
    "PLANNED": 3,
    "APPLIED": 18,
    "VIEWED": 4,
    "INTERVIEW_1": 3,
    "INTERVIEW_2": 1,
    "TEST_TASK": 1,
    "OFFER": 1,
    "REJECTED": 4,
    "NO_RESPONSE": 2,
    "WITHDREW": 0
  },
  "follow_ups_due": 6,
  "applied_count": 34,
  "interview_count": 5,
  "offer_count": 1,
  "rejected_count": 6,
  "response_rate": 0.2647,
  "interview_rate": 0.1471,
  "offer_rate": 0.0294
}
```

**Counting rules:**

| Field | Counted statuses |
|---|---|
| `applied_count` | APPLIED, VIEWED, INTERVIEW_1, INTERVIEW_2, TEST_TASK, OFFER, REJECTED, NO_RESPONSE, WITHDREW |
| `interview_count` | INTERVIEW_1, INTERVIEW_2, TEST_TASK |
| `offer_count` | OFFER |
| `rejected_count` | REJECTED, NO_RESPONSE |
| `follow_ups_due` | Active (not archived) apps where `needs_follow_up=true` and `follow_up_due_at ≤ now` |

**Rate formulas** (denominator is `applied_count`; 0.0 when no applications):

```
response_rate  = (VIEWED + INTERVIEW_1 + INTERVIEW_2 + TEST_TASK + OFFER + REJECTED) / applied_count
interview_rate = (INTERVIEW_1 + INTERVIEW_2 + TEST_TASK) / applied_count
offer_rate     = OFFER / applied_count
```

All rates are rounded to 4 decimal places.

---

## Documents

Application-related file attachments (CV, cover letter, portfolio, etc.).

### Allowed file types

| Extension | MIME type |
|---|---|
| `.pdf` | `application/pdf` |
| `.docx` | `application/vnd.openxmlformats-officedocument.wordprocessingml.document` |
| `.txt` | `text/plain` |
| `.zip` | `application/zip` |

Maximum file size: **10 MB**.

### POST /applications/{app_id}/documents

Upload a file attachment. Request must be `multipart/form-data`.

```
POST /api/v1/applications/{app_id}/documents
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**Form fields:**

| Field | Required | Type | Notes |
|---|---|---|---|
| `file` | Yes | binary | File binary data |
| `kind` | No | enum | `cv` \| `cover_letter` \| `portfolio` \| `other` (default: `other`) |

**Response 201:**
```json
{
  "id": "d4e5f6a7-...",
  "application_id": "3fa85f64-...",
  "kind": "cv",
  "original_filename": "resume.pdf",
  "content_type": "application/pdf",
  "size_bytes": 153472,
  "sha256_hash": "e3b0c44298fc1c149afb...",
  "status": "active",
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Response 404:** Application not found or belongs to another user.

**Response 413:** File exceeds 10 MB.

**Response 422:** Unsupported file extension.

> The `original_filename` is stored for display only. The server generates an opaque storage key (`users/{uid}/applications/{app_id}/documents/{doc_id}/original{ext}`) — the original filename is never used in any filesystem path.

---

### GET /applications/{app_id}/documents

List all documents for an application.

```
GET /api/v1/applications/{app_id}/documents
Authorization: Bearer <token>
```

**History type filter values:**

`APPLICATION_CREATED`, `STATUS_CHANGE`, `FIELD_CHANGE`, `COMMENT`, `APPLICATION_ARCHIVED`, `DOCUMENT_UPLOADED`, `DOCUMENT_DELETED`.

**Response 200:**
```json
{
  "items": [
    {
      "id": "d4e5f6a7-...",
      "application_id": "3fa85f64-...",
      "kind": "cv",
      "original_filename": "resume.pdf",
      "content_type": "application/pdf",
      "size_bytes": 153472,
      "sha256_hash": "e3b0c44298fc1c149afb...",
      "status": "active",
      "created_at": "2024-01-15T10:00:00Z",
      "updated_at": "2024-01-15T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Response 404:** Application not found or belongs to another user.

---

### GET /documents/{document_id}

Get metadata for a single document.

```
GET /api/v1/documents/{document_id}
Authorization: Bearer <token>
```

**Response 200:** `DocumentRead` object (same shape as list item above).

**Response 404:** Document not found or belongs to another user.

---

### GET /documents/{document_id}/download

Download the document file.

```
GET /api/v1/documents/{document_id}/download
Authorization: Bearer <token>
```

**Response 200:** Binary file content with:
- `Content-Type`: stored MIME type
- `Content-Disposition: attachment; filename="<original_filename>"`

**Response 404:** Document not found, belongs to another user, or file missing from storage.

---

### DELETE /documents/{document_id}

Permanently delete a document (metadata + stored file). Hard delete — no recovery.

```
DELETE /api/v1/documents/{document_id}
Authorization: Bearer <token>
```

**Response 204:** No body.

**Response 404:** Document not found or belongs to another user.

---

## Frontend integration notes

### REST as source of truth for applications

- **Read** all application data from REST, not Firestore.
- **Write** all application creates, patches, and status changes through REST.
- Keep Firebase only for login and ID token retrieval. Do **not** write application records directly to Firestore.

### Obtaining an ID token

```typescript
import { getAuth } from "firebase/auth";
const token = await getAuth().currentUser?.getIdToken();
// Attach as: Authorization: Bearer <token>
```

### Handling common error statuses

| Status | What to do |
|---|---|
| `401` | Token expired — call `getIdToken(true)` to force-refresh, then retry once |
| `403` / `404` | Resource not found or access denied — show "not found" UI |
| `422` | Validation error — show `error.message` to the user |
| `503` | Backend not ready (Firebase unconfigured or DB down) — show a service unavailable banner |

### Endpoints that automatically write activity/history

| Endpoint | History type | Activity kind |
|---|---|---|
| `POST /applications/{id}/comments` | `COMMENT` entry | `COMMENT_ADDED` |
| `POST /applications/{id}/status` | `STATUS_CHANGE` entry | `STATUS_CHANGED` |
| `PATCH /applications/{id}` | `FIELD_CHANGE` entry per changed field | `APPLICATION_UPDATED` |

---

## Local setup notes

| Item | Value |
|---|---|
| PostgreSQL host port | **5433** (a second project occupies 5432 on this machine) |
| DATABASE_URL in `backend/.env` | `postgresql+asyncpg://postgres:postgres@127.0.0.1:5433/job_tracker` |
| Backend local dev port | **8001** (matches the React dev gateway default in `src/shared/config/backendConfig.ts`) |
| Docker API port | **8000** (change left side of `ports:` in `docker-compose.yml` if needed) |
| Frontend dev server | `http://localhost:3000` — use this exact origin; `127.0.0.1:3000` is blocked by CORS |
| CORS allowed origins | `http://localhost:3000`, `http://localhost:5173` (Vite default) |

> **Port 5432 occupied?** If another PostgreSQL instance is on 5432, set `ports: ["5433:5432"]` in `backend/docker-compose.yml` and update `DATABASE_URL` in `backend/.env`. See [backend/README.md](../backend/README.md) for the full instructions.

---

## Sprint status

| Sprint | Scope | Status |
|---|---|---|
| S1 | Foundation — health, config, DB | ✅ Done |
| S2 | Firebase Auth + users | ✅ Done |
| S3 | Applications CRUD + history + activity + analytics | ✅ Done |
| S4 | Automatic history on status change/patch | ✅ Done |
| S5 | Frontend REST gateway integration | ⏳ Paused (handled separately by Codex) |
| S6 | Analytics refinement + cleanup | ⏳ Pending |
| S7 | Documents/files module | ✅ Done |
