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
| 422 | `"CYCLE_REQUIRED"` | Application create request omitted `cycle_id` |
| 422 | `"INVALID_CYCLE"` | `cycle_id` is invalid, belongs to another user, paused, or archived |
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
  "created_at": "2024-01-15T10:00:00Z",
  "updated_at": "2024-01-15T10:00:00Z"
}
```

**Read-only fields** (cannot be changed via PATCH): `id`, `firebase_uid`, `email`, `photo_url`, `created_at`.

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

## Cycles

Cycles are backend-owned source-of-truth job search campaigns/search directions. Every newly created application must reference one active cycle owned by the current authenticated user.

A cycle can represent a user-facing "Направление поиска" / "Цикл поиска", for example: "Ausbildung Fachinformatiker 2026".

**CycleStatus:** `active` | `paused` | `archived`

### GET /cycles

List cycles for the current user. Sorted by `updated_at` desc, then `created_at` desc.

```
GET /api/v1/cycles
GET /api/v1/cycles?status=active
Authorization: Bearer <token>
```

**Query params:**

| Name | Type | Default | Notes |
|---|---:|---:|---|
| `status` | `active` \| `paused` \| `archived` | — | Optional status filter |

**Response 200:**
```json
[
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "user_id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
    "title": "Ausbildung Fachinformatiker 2026",
    "target_role": "Fachinformatiker Anwendungsentwicklung",
    "location": "Wolfsburg / Braunschweig",
    "goal": "Find Ausbildung contract for 2026",
    "description": "Primary search direction for Ausbildung applications",
    "weekly_target": 10,
    "start_date": "2026-01-01",
    "end_date": "2026-12-31",
    "status": "active",
    "created_at": "2026-05-12T10:00:00Z",
    "updated_at": "2026-05-12T10:00:00Z"
  }
]
```

### POST /cycles

Create a cycle. New cycles start with status `active`.

```
POST /api/v1/cycles
Authorization: Bearer <token>
Content-Type: application/json
```

**Request body:**
```json
{
  "title": "Ausbildung Fachinformatiker 2026",
  "target_role": "Fachinformatiker Anwendungsentwicklung",
  "location": "Wolfsburg / Braunschweig",
  "goal": "Find Ausbildung contract for 2026",
  "description": "Primary search direction for Ausbildung applications",
  "weekly_target": 10,
  "start_date": "2026-01-01",
  "end_date": "2026-12-31"
}
```

**Response 201:** `CycleRead`.

**Validation:** `title` and `target_role` are required. Extra fields are rejected with `422`.

### GET /cycles/{cycle_id}

Return one cycle owned by the current user.

**Response 404:** Cycle not found or belongs to another user.

### PATCH /cycles/{cycle_id}

Update mutable cycle fields.

**Request body** (all fields optional):
```json
{
  "title": "Updated title",
  "target_role": "Platform Engineer",
  "location": "Berlin",
  "goal": "Updated goal",
  "description": "Updated description",
  "weekly_target": 20,
  "start_date": "2026-02-01",
  "end_date": null,
  "status": "paused"
}
```

`status` may be `active`, `paused`, or `archived`.

### DELETE /cycles/{cycle_id}

Soft-delete a cycle by setting `status=archived`. Existing applications keep their `cycle_id`; new applications cannot be created into an archived cycle.

**Response 204:** No body.

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
| `cycle_id` | UUID | — | existing cycle id | Filter by source cycle |
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
      "cycle_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
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

**Request body** (`cycle_id`, `company_name`, and `role_title` are required by backend service rules; all others optional):
```json
{
  "cycle_id": "4b33e9a4-7a7e-4d94-87c1-5d70b78e48a0",
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

**Validation:** Extra fields are rejected with `422`. `company_name` and `role_title` cannot be null or empty. If `cycle_id` is omitted, the backend returns `422` with code `CYCLE_REQUIRED`. If `cycle_id` is invalid, belongs to another user, paused, or archived, the backend returns `422` with code `INVALID_CYCLE`.

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

**Read-only fields** (not accepted in PATCH body): `id`, `user_id`, `cycle_id`, `stage`, `needs_follow_up`, `follow_up_due_at`, `needs_reapply_suggestion`, `reapply_eligible_at`, `last_status_change_at`, `created_at`, `updated_at`, `role_fingerprint`.

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
