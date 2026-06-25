# ADR-004 — Dashboard page, data & status ownership

- **Status:** Accepted (Stage 11)
- **Date:** 2026-06-25
- **Related:** [ADR-001 — Match Score ownership](ADR-001-match-score-ownership.md) ·
  [ADR-002 — Preview vs persisted matches](ADR-002-preview-search-vs-persisted-matches.md) ·
  [ADR-003 — Discovery source priority](ADR-003-discovery-source-priority.md) ·
  [Loops / Matches architecture](../LOOPS_MATCHES_ARCHITECTURE.md) ·
  [Glossary](../GLOSSARY.md)

## Context

The dashboard has four user-facing product areas plus a shell, and their
responsibilities drifted over time (a board that read vacancy-match rows, a
matches page rebuilt as V2 while V1 lingered, hardcoded UI text). Recent stages
fixed the behaviour piecemeal:

1. **BoardPage** now reads **Applications** as its data source (not LoopMatch /
   vacancy-match rows).
2. **LoopsPage** and **MatchesPage** were de-duplicated — dead V1 shadow code
   removed; oversized pages split into components/hooks/helpers.
3. The **Matches feed respects active loop/source config** — an active loop with
   `selected_sources = []` contributes **no** rows to the default feed.

This ADR fixes those decisions so future work does not re-mix the domains.

## The product model

```
Loop ──► VacancyMatch ──► Application
```

- **Loop / Search Direction** — a saved search the system runs.
- **VacancyMatch** — a backend-persisted found vacancy (`new → saved → converted`).
- **Application** — a tracked job application, created *from* a match or directly.

See [LOOPS_MATCHES_ARCHITECTURE.md](../LOOPS_MATCHES_ARCHITECTURE.md) for the full
discovery/preview/persist pipeline.

## Decision

### 1. Page ownership

| Route | Owns | Must NOT |
|---|---|---|
| `/dashboard/loops` | Search Directions / Loops (list + details) | own match or application data models |
| `/dashboard/matches` | The VacancyMatch feed (cross-loop list + detail) | own application data; compute a score |
| `/dashboard/applications` | The Application list view | use match rows as its source |
| `/dashboard/board` | The Application **board** view | use LoopMatch / vacancy-match rows as its primary data source |
| Dashboard shell (`app/widgets/*`, layout) | Navigation + layout only | own any product data |

`/dashboard/applications` and `/dashboard/board` are **two views over the same
Applications data** — different presentations, one source.

### 2. Data ownership

| Concern | Source of truth | Notes |
|---|---|---|
| Loops | Loop APIs (`features/loops`) | `useBackendLoopsQuery`, `listLoopsViaRest`, `getLoopViaRest` |
| Matches feed | Vacancy-match feed APIs (`features/vacancyMatches`) | `listMatchesFeedViaRest`; backend owns filter/sort/counts/pagination |
| Applications list & board | Applications APIs (`features/applications`) | the board is **not** a matches board |
| Match Score | **Backend** | frontend displays `match.score` only — see [ADR-001](ADR-001-match-score-ownership.md). Never recompute on the client. |

### 3. Status ownership

- **Match status** (`new` / `saved` / `converted`) belongs to **VacancyMatch**.
  It is shown on the Matches page; the UI maps the technical value to a label in
  the translation layer (`matches.matchStatus.*`), never inline in business logic.
- **Application `process.status`** belongs to **Application**.
- **Board columns map `Application.process.status`** to application-native
  columns. They do **not** map vacancy-match statuses. A match status must never
  drive a board column.

### 4. i18n rule

- **No new hardcoded user-facing text in page components.** All visible
  labels / buttons / tabs / empty / loading / error states / tooltips / column
  titles / card actions use translation keys.
- Keys are grouped by domain: `dashboard.*`, `applications*.*`, `board.*`,
  `loops.*`, `matches.*`. Prefer **stable keys** over text-derived keys.
- **Technical constants / status values are mapped in the UI/translation layer**,
  not translated inside business logic. Source labels (proper nouns such as
  "Arbeitsagentur") and backend reason/penalty codes are localized in dedicated
  mapping helpers, not scattered across components.
- Supported languages: **en, ru, de** (the `uk` option is registered but falls
  back to `en`). Every new key must exist in `en` / `ru` / `de` — enforced by
  `scripts/check-i18n.mjs`.

## Consequences

- A board that reads match rows, or a matches page that computes a score, is a
  regression against this ADR — not a feature.
- The Matches page is the single owner of the vacancy-match feed UI; its V2
  components are i18n-driven (`matches.*`). The legacy `matches.common/details/
  fields/...` keys remain only because the `entities/loopMatch` match-card UI and
  the (deferred) MatchDetailsPage controller still reference them.

## Out of scope / follow-ups

- **MatchDetailsPage** (`/dashboard/matches/:matchId`) i18n + dead-V1-controller
  removal — deferred to its own stage (it still references legacy `matches.*` keys).
- **ApplicationsPage / BoardPage** hardcoded-text → i18n migration — deferred
  (Board was mid-flight under a separate effort during Stage 11).
- Pre-existing `check-i18n` gaps in other areas (ProfileQuestionsPage,
  DashboardPage, AccountSettings, pre-existing LoopsPage `de.json` keys) are
  unrelated to this ADR and tracked separately.
