# ADR-001 — Match Score ownership

- **Status:** Accepted (Stage 6c/6d)
- **Date:** 2026-06-13
- **Related:** [ADR-002 — Preview search vs persisted matches](ADR-002-preview-search-vs-persisted-matches.md),
  [Loops / Matches architecture](../LOOPS_MATCHES_ARCHITECTURE.md),
  [Backend API contract](../backend-api-contract.md)

## Context

A vacancy's "fit" score (Match Score) was historically computed in **three**
independent, mutually inconsistent places:

1. a backend deterministic evaluator (`vacancy_matches/evaluation.py`, 0–100,
   on-demand via the `/evaluate` endpoint);
2. a backend discovery "relevance" heuristic (0–1, persisted into the JSONB
   `confidence` field at auto-discovery time);
3. a frontend page-level heuristic (`computeMatchScore`, unbounded, untested,
   different weights, including freshness).

The same vacancy could therefore show three different numbers on three screens,
no score was queryable (so "top matches" actually meant "freshest matches"), and
server-side score sorting was impossible.

## Decision

**The backend is the single source of truth for Match Score.** The frontend
**must not** calculate a Match Score; it only displays the backend value.

1. **One scoring core.** `backend/app/modules/vacancy_matches/scoring.py` is the
   only place a Match Score is computed. It is:
   - **deterministic** — same inputs always produce the same result;
   - **versioned** — `SCORE_VERSION` (currently `1`) is recorded with every
     score so stale rows are identifiable after a formula change;
   - **explainable** — it emits machine-readable reason/penalty **codes**
     (e.g. `title_match`, `keyword_matched`, `source_selected`,
     `excluded_keyword`), each with the matched `terms`.
2. **Persisted and queryable.** Match Score lives on `vacancy_matches` as
   match-level columns:
   - `score` (`INT`, 0–100, indexed) — used for `ORDER BY score DESC NULLS LAST`;
   - `score_version` (`INT`) — the `SCORE_VERSION` that produced the value;
   - `score_details` (`JSONB`) — component breakdown + coded reasons/penalties.

   `NULL` score means "not yet scored" (rows that predate the scoring migration
   `0023_add_match_score`); such rows sort **after** scored rows.
3. **`score_details` is separate from `confidence`.** `confidence` remains a
   legacy / preview-related field during the transition and is **not** reused as
   the scoring namespace. Do not move scoring data into `confidence`.
4. **Scores are written on every persist path** — discovery auto-persist, manual
   "from-preview" save, and the loop-PATCH rescore hook (when a score-relevant
   loop field changes: `target_role`, `location`, `keywords`,
   `excluded_keywords`, `selected_sources`). Status changes and `seen_at` updates
   do **not** rescore.
5. **The `/evaluate` endpoint** remains for deeper, on-demand explanation
   (component breakdown + duplicate detection). It is backward-compatible and
   now also returns `reason_codes` / `penalty_codes`.
6. **Frontend displays only.** The frontend reads `match.score` (with the legacy
   `confidence.score` as a transitional fallback), shows a neutral state when
   `score` is `null` (e.g. «Оценка ещё не рассчитана» / a dash), and localizes
   explanations from `reason_codes` / `penalty_codes`, preferring codes over the
   legacy English strings.

## Scoring formula (v1)

Weights are intentionally identical to the pre-consolidation evaluator (parity
is enforced by `backend/tests/modules/vacancy_matches/test_scoring.py`):

| Component | Value |
|---|---|
| Title | `0` / `15` (partial) / `25` (full target-role token overlap) |
| Location | `0` / `10` (substring containment either way) |
| Keywords | `+10` each, capped at `30` |
| Source | `0` / `15` (vacancy source ∈ loop's selected sources) |
| Excluded keywords | `−15` each, capped at `30` (penalty) |
| **Total** | `clamp(0, 100)` |

Bumping the weights **must** bump `SCORE_VERSION`.

## Consequences

- Loop Details "Top Matches" and the Matches page show the same, consistent,
  server-owned number; lists can be ranked by score (`sort=score`).
- The frontend heuristic `computeMatchScore` was deleted (Stage 6d).
- Preview search shows the **same** 0–100 score (computed by the same core), so
  the preview number equals the score the row would carry once saved — see
  [ADR-002](ADR-002-preview-search-vs-persisted-matches.md).

## Unsupported signals — do NOT fake

The following are **not** scored in v1 because the vacancy side carries no such
data yet. They must **not** be invented or stubbed with placeholder values until
real data exists on `VacancyMatch`:

- **work mode** — `employment_type_match_score` / `work_mode_match_score` remain
  in the `/evaluate` response for backward compatibility but emit `0`;
- **employment type** — same as above;
- **salary** — only present on `Application`, not on the match;
- **language** — absent everywhere;
- **seniority** — exists in frontend canonical filters but is never persisted on
  the loop or the match.

When the underlying data is added, introduce the component, bump
`SCORE_VERSION`, and backfill deliberately — never synthesize a score from
missing data.
