# Frontend ↔ Backend integration notes

## Local URLs

- Frontend: `http://localhost:3000`
- Backend API: `http://127.0.0.1:8001/api/v1`
- Frontend auth provider remains Firebase Auth.
- Every protected backend REST request sends `Authorization: Bearer <Firebase ID token>` via the shared REST client.

## Loops are the search directions

The product has one user-facing search direction concept: **Loops**.

A Loop represents a job-search direction or campaign, for example:

- `Ausbildung Fachinformatiker Anwendungsentwicklung 2026`
- `Junior Frontend Developer`
- `Backend Developer Python/FastAPI`
- `Sales Manager B2B`

`/dashboard/loops` is the only frontend management page for search directions. The duplicate `/dashboard/old-search-page` route/page has been removed from routing/navigation because it duplicated the existing Loops concept.

Existing Loop storage/API remains the current source for Loop UI. Backend application records use `loop_id` / `has_loop` for application-to-loop linkage.

## Application creation requires a Loop

The application creation dialog no longer creates a separate Loop / Search direction. It requires selecting an existing Loop.

Behavior:

- The field label is `Направление поиска *`.
- If exactly one Loop exists, it is selected automatically.
- `roleTitle` is prefilled from the selected Loop's first title, then canonical role, then Loop name.
- If the user manually edits `roleTitle`, changing the Loop does not overwrite it unexpectedly unless the field is empty.
- If no Loops exist, the application form is hidden and the dialog shows:
  - `Сначала создайте направление поиска`
  - `Заявка должна относиться к активному направлению поиска.`
  - CTA: `Перейти к направлениям поиска`, navigating to `/dashboard/loops`.

Create payload mapping:

```json
{
  "company_name": "Acme GmbH",
  "role_title": "Frontend Engineer",
  "loop_id": "<loop-id>"
}
```

Do not introduce a second `legacy_loop_id` frontend flow. If a backend environment still requires `legacy_loop_id`, that is a backend contract mismatch and should be fixed backend-side by using backend-owned Loops.

## Applications filtering by Loop

Loops can open their applications via:

```text
/dashboard/applications?loopId=<loop-id>
```

ApplicationsPage reads `loopId` from the URL and sends:

```text
GET /applications?loop_id=<loop-id>
```

The page shows a filter indicator:

```text
Направление поиска: <loop name>
Сбросить
```

Clearing the filter removes `loopId` from the URL. Changing the Loop filter resets pagination offset to `0`.

## Applications list pagination

Backend list response envelope:

```json
{
  "items": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

Frontend behavior:

- Default page size: `20`.
- Backend max limit: `100`.
- REST helper clamps accidental values above `100`.
- Pagination uses `total`, `limit`, and `offset`.
- Active tab sends `archived=false`.
- Archive tab sends `archived=true`.
- Favorite filter sends `is_favorite=true`.

Supported application list params currently used by frontend:

```text
status
archived
limit
offset
sort
loop_id
is_favorite
```

## Favorites

Favorite state is backend persisted on applications:

```json
{ "is_favorite": true }
```

Frontend uses:

```text
PATCH /applications/{app_id}
```

ApplicationsPage also supports a favorite-only filter through:

```text
GET /applications?is_favorite=true
```

## Archive / restore applications

`DELETE /applications/{app_id}` is a safe soft archive:

- sets `archived=true`
- does not physically delete the row
- does not delete history/documents

Restore uses:

```json
PATCH /applications/{app_id}
{ "archived": false }
```

## Tags

Application tags are a simple string array. Frontend sends the full replacement array through:

```text
PATCH /applications/{app_id}
```

Backend normalizes tags by trimming, dropping empty values, and deduplicating case-insensitively.

## History pagination and filters

History endpoint response envelope:

```json
{
  "items": [],
  "total": 0,
  "limit": 20,
  "offset": 0
}
```

Frontend supports:

```text
limit
offset
type
```

Supported type filters:

```text
APPLICATION_CREATED
STATUS_CHANGE
FIELD_CHANGE
COMMENT
APPLICATION_ARCHIVED
DOCUMENT_UPLOADED
DOCUMENT_DELETED
```

ApplicationDetailsPage loads history through the paginated REST helper and keeps a compatibility wrapper for older callers that only need `items`.

## Remaining Firestore/local flows

These remain intentionally Firestore/local-backed until backend endpoints exist:

- today priority view
- followups view
- autoGhosting
- reminders persistence
- active reminders subscription/bell
- calendar sync persistence
- contacts/interactions
- Firestore subscriptions/realtime
- loop match reads
- advanced dashboard charts/trends/status radar
- legacy Firestore fallback modules

## Local smoke checklist

1. Login with Firebase Auth.
2. Open `/dashboard/loops`.
3. Create a Loop if none exists.
4. Open Applications and create a new application.
5. Confirm the request body uses `loop_id`, not `legacy_loop_id`.
6. Open a Loop's applications from `/dashboard/loops` and confirm URL contains `?loopId=<id>`.
7. Confirm ApplicationsPage sends `loop_id=<id>` to the backend list endpoint.
8. Toggle favorite and archive/restore an application.
9. Open ApplicationDetailsPage and confirm history pagination/filtering still works.
