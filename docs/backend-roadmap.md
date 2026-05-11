# Backend Roadmap

Tracks completed and planned backend hardening / feature work. For the full API shape see [backend-api-contract.md](backend-api-contract.md).

## Completed

### B1 — Foundation
Health endpoints, config, DB session, Alembic migrations, CORS.

### B2 — Firebase Auth + Users
Firebase ID-token verification, user auto-provisioning, `GET /users/me`, `PATCH /users/me`.

### B3 — Applications CRUD
`POST`, `GET`, `PATCH`, `DELETE /applications/{id}`, soft-delete via archive flag, derived field computation (`stage`, `needs_follow_up`, follow-up schedule, reapply suggestion).

### B4 — History + Activity + Analytics
`GET /applications/{id}/history`, `POST /applications/{id}/comments`, automatic history events on status change and field patch, `GET /activity/feed`, `GET /analytics/kpi`.

### B5 — Frontend REST gateway
React query layer switched from Firestore to REST (`src/shared/api/`). Handled separately by Codex.

### B6 — Request tracing (X-Request-ID)
`RequestIDMiddleware` injects `X-Request-ID` into every response (including 500s). Error envelope carries `error.request_id`. Fixed Starlette `scope["state"]` compatibility with Python 3.14.

### B7 — Applications filtering, sorting, pagination, pipeline age
`GET /applications` now returns `ApplicationListResponse` envelope (`items`, `total`, `limit`, `offset`). Added `sort`, `limit`, `offset`, `search`, `stage` query params. Age fields (`days_in_pipeline`, `days_since_applied`, `days_in_current_status`) computed at serialisation time on every `ApplicationRead`.

### B8 — Documents / files module
Upload, list, download, and delete application-related file attachments (CV, cover letter, portfolio). Local filesystem storage with SHA-256 hash. Allowed: `.pdf`, `.docx`, `.txt`, `.zip` ≤ 10 MB. Hard delete. Storage key never uses original filename (no path traversal).

**Paths added:**
- `POST /applications/{app_id}/documents`
- `GET /applications/{app_id}/documents`
- `GET /documents/{document_id}`
- `GET /documents/{document_id}/download`
- `DELETE /documents/{document_id}`

---

## Pending

### B9 — Document cloud storage adapter
Add an `S3StorageAdapter` (or Azure Blob) implementing the same `save / load / delete` interface as `LocalStorageAdapter`. Switchable via `STORAGE_PROVIDER` env var. No endpoint changes required.

### B10 — Analytics refinement
Break `GET /analytics/kpi` response into per-stage funnels; add `pipeline_velocity` (average days per stage); expose a `GET /analytics/timeline` endpoint for the chart view.

### B11 — Pagination cursors
Replace `offset`-based pagination on `GET /applications` with cursor-based pagination for stable ordering under concurrent writes.

### B12 — Webhooks / notifications
Push application status-change events to a configurable webhook URL (Slack, n8n, etc.).
