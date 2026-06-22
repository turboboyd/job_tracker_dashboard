# Loops → Matches → Applications — architecture guide

A stable developer guide for the discovery / matches / applications pipeline.
Read this before changing anything in `loops`, `vacancy_matches`,
`discovery_runs`, the scheduler, or the Matches / Loop Details frontend.

**Architecture decisions:**
[ADR-001 — Match Score ownership](adr/ADR-001-match-score-ownership.md) ·
[ADR-002 — Preview vs persisted matches](adr/ADR-002-preview-search-vs-persisted-matches.md) ·
[ADR-003 — Discovery source priority](adr/ADR-003-discovery-source-priority.md)

Related: [Matches feed workflow](matches-feed-workflow.md) ·
[Backend API contract](backend-api-contract.md) ·
[Glossary](GLOSSARY.md)

## The flow

```
Loop  ──(discovery run)──►  Preview items
 │                              │
 │  dry_run=true  ──────────────┴──►  PREVIEW SEARCH (temporary, not saved)
 │                                      • shown in a disclosure block
 │                                      • "Предварительный поиск — не сохраняется автоматически"
 │                                      • explicit user action only ↓
 │
 └─ dry_run=false (auto-discovery) ──►  VacancyMatch (status="new", scored)
                                          │
                 manual "save"  ────────► status="saved"
                                          │
                 convert / from-preview ► status="converted" + Application
```

- **Loop** — a saved, persistent search direction owned by a user (role,
  location, radius, keywords, excluded keywords, selected sources, auto-discovery
  settings).
- **Discovery run** — a pass over the loop's sources. A **dry run** is a
  **preview search** (returns items, persists nothing). A **non-dry run**
  (auto-discovery / scheduler) persists freshly-found vacancies.
- **Preview search ("Предварительный поиск")** — temporary, manual, not a Loop,
  never auto-persists. See [ADR-002](adr/ADR-002-preview-search-vs-persisted-matches.md).
- **VacancyMatch** — the **persisted source of truth** for the Matches list and
  Loop Details "Top Matches". Lifecycle: `new` → `saved` → `converted`.
- **Application** — created from a match (or directly); the match is marked
  `converted` and linked via `application_id`.

## Data ownership

| Concept | Owner | Notes |
|---|---|---|
| Match Score (`score`, `score_version`, `score_details`) | **Backend** | Computed by `vacancy_matches/scoring.py`; frontend displays only. See [ADR-001](adr/ADR-001-match-score-ownership.md). |
| Persisted matches | Backend `vacancy_matches` | Model A: the only source for Matches / Top Matches. |
| Preview results | Transient | Returned by a dry-run discovery; never written by the preview path. |
| `Loop.next_run_at` | **Scheduler** (`app/scheduler.py`) + loop-PATCH hook | Do not write it elsewhere. |
| Source priority / labels | `entities/loop` (frontend) | Single registry; see [ADR-003](adr/ADR-003-discovery-source-priority.md). |

## Backend modules

- `app/modules/loops/` — Loop CRUD; `service.py` PATCH triggers the **rescore
  hook** when a score-relevant field changes.
- `app/modules/vacancy_matches/`
  - `scoring.py` — the single scoring core (`SCORE_VERSION`, `score_match`,
    coded reasons, `apply_score`).
  - `rescore.py` — capped (500) synchronous batch rescore for a loop's matches.
  - `evaluation.py` — duplicate detection + `/evaluate` response assembly (uses
    the core; backward-compatible, adds `reason_codes` / `penalty_codes`).
  - `service.py` / `repository.py` / `router.py` — persistence, the cross-loop
    feed, `sort=freshness|score`, and the per-loop list (`sort=freshness|score`).
- `app/modules/discovery_runs/service.py` — runs discovery; `_persist_matches`
  scores each auto-persisted row; `_rank_preview_items` scores previews with the
  same core (annotates `confidence.score` + a deprecated `confidence.relevance`
  mirror).
- `app/scheduler.py` — background warming. **Only** processes loops where
  `status = "active"` AND `auto_discovery_enabled = true` AND a due `next_run_at`.
- `app/db/models/vacancy_match.py` — the `score` / `score_version` /
  `score_details` columns (migration `0023_add_match_score`).

## Frontend modules

- `src/entities/loop/model/platformRegistry.ts` — centralized source priority
  (`DISCOVERY_SOURCE_PRIORITY`, `DEFAULT_SELECTED_PLATFORMS`).
- `src/features/vacancyMatches/rest/{adapter,queries}.ts` — DTO ⇄ model mapping
  (`score`, `scoreVersion`, `reasonCodes`, `penaltyCodes`), `sort=score`.
- `src/pages/LoopsPage/components/`
  - `loopDetailsView.helpers.ts` — `selectTopScoredMatches` (Top Matches by
    backend score; NULLS last, freshness tie-break). The old `computeMatchScore`
    heuristic was **removed**.
  - `loopDetailsView.overviewTab.tsx` — renders `match.score` (neutral dash when
    `null`); preview disclosure.
- `src/pages/MatchesPage/components/`
  - `matchesV2.helpers.ts` — `getMatchScore` (reads `match.score`), verdict +
    reason-code localization (`localizeEvaluationReasons/Penalties`).
  - `MatchesDetailPanel.tsx` — evaluation panel, code-first localization.

## Score flow

1. A match is created (discovery auto-persist, or manual/from-preview save) →
   `scoring.score_match(loop, input)` → `apply_score` writes
   `score` / `score_version` / `score_details`.
2. Editing a loop's score-relevant fields (`target_role`, `location`,
   `keywords`, `excluded_keywords`, `selected_sources`) → `rescore_loop_matches`
   recomputes the loop's matches (capped 500; does **not** bump `updated_at`).
3. Lists expose `sort=score` (score DESC NULLS LAST, freshness tie-break);
   **default sort stays freshness/`posted`** — unchanged.
4. Frontend reads `match.score` and shows a neutral state for `null`.

## Scheduler flow

Every tick the scheduler selects loops that are `active`, have
`auto_discovery_enabled = true`, are due (`next_run_at` null or in the past), and
have selected sources; it runs a non-dry discovery (persisting + scoring new
matches) and advances `next_run_at`. Loops with auto-discovery **disabled** are
never warmed — keeping deterministic datasets (e.g. dev-QA seed) stable.

## Seed / dev-QA flow

`backend/scripts/seed_dev_qa.py` creates a deterministic dev-QA dataset
(`dev-qa-user`, 2 loops, 8 matches, 2 applications) with **auto-discovery
disabled** so the scheduler cannot mutate it. It scores its matches through the
real scoring core (deterministic given fixed inputs). `--reset-dev-qa --apply`
safely wipes only the dev-QA user's data (guarded: development + local DB host).

## What should NOT be changed casually

- The **freshness-first default sort** (`posted_at DESC NULLS LAST, updated_at,
  created_at, id`) and the seen/unseen watermark semantics.
- The **cross-loop feed's active-config scoping**: a loop contributes matches
  only when it is not paused/archived **and** has ≥1 currently-`selected_sources`,
  and only for matches whose `source` is in that allow-list. An empty
  `selected_sources` means the loop searches nothing → it contributes **no**
  matches (mirrors the scheduler skipping sourceless loops). This is a view
  filter — rows are never deleted and stay on the loop's own page.
- The **preview / persist boundary** and the «не сохраняется автоматически» UX
  (Model A) — preview must never auto-persist.
- **Backend score ownership** — never reintroduce a frontend score calculation.
- **Scheduler gating** (`status='active' AND auto_discovery_enabled AND due`).
- The **centralized source priority** (no per-page source-order duplication).
- `score_details` must stay separate from `confidence`.

## Known technical debt / future cleanup

- **Score/verdict frontend helpers live in the page layer**
  (`src/pages/MatchesPage/components/matchesV2.helpers.ts`). They should move to
  `src/features/vacancyMatches/model` so Loop Details can reuse them without a
  cross-page import. Deferred to avoid FSD churn.
- **Loop Details Top-N is computed client-side over the first 200 fetched
  matches.** A loop with >200 matches could miss a high-scorer beyond that page.
  The adapter already supports `sort=score`; add a dedicated server-side Top-N
  request if/when loops routinely exceed 200 matches.
- **Legacy evaluation string fallback** (`localizeEvaluationReason/Penalty`) can
  be removed once the frontend fully relies on `reason_codes` / `penalty_codes`.
- **`employment_type` / `work_mode` score fields emit `0`** until vacancy-side
  data exists; do not fake them (see [ADR-001](adr/ADR-001-match-score-ownership.md)).
- **Pre-existing FSD boundary violations** (deep imports, PROJECT_MAP gaps) are
  pre-existing and out of scope for the Match Score work; track separately.
- **Seed score variety** — the dev-QA seed currently produces near-identical
  scores, so `sort=score` shows little visible reordering in manual QA. Improve
  the seed inputs when richer QA is needed.
