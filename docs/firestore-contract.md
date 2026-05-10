# Firestore Contract

This file documents the contract used by the current client app.

## Ownership

- User-owned data lives under `users/{uid}`.
- Client reads and writes only its own path.
- `applications` documents must keep `createdBy` equal to the authenticated uid.
- `applications` are not physically deleted by the client; user-facing delete/archive flows set `archived: true`.
- `applications/{appId}/history` is append-only from the client: history entries can be read and created, but not updated or deleted.

## Main Collections

- `users/{uid}/loops`
- `users/{uid}/applications`
- `users/{uid}/applications/{appId}/history`
- `users/{uid}/private/{docId}`
- `users/{uid}/cv_versions`
- `publicStats/{docId}` for read-only public aggregates

## Query Assumptions

The app expects these indexed application queries to work:

- Pipeline: `archived == false`, `process.status == <status>`, ordered by `process.lastStatusChangeAt desc`.
- Today: `archived == false`, ordered by `priority.score desc`.
- Follow-ups: `archived == false`, `process.needsFollowUp == true`, ordered by `process.followUpDueAt asc`.
- Matches by loop: `archived == false`, `loopLinkage.loopId == <loopId>`.

## Migration Note

Older technical specs mention a Cloud Functions-only write model. That remains a possible future hardening step, but the current deployed SPA writes through the Firebase client SDK and relies on scoped security rules plus user-owned document paths.
