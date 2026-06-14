# ADR-002 — Preview search vs persisted matches

- **Status:** Accepted (Stage 5 / Stage 6)
- **Date:** 2026-06-13
- **Related:** [ADR-001 — Match Score ownership](ADR-001-match-score-ownership.md),
  [Loops / Matches architecture](../LOOPS_MATCHES_ARCHITECTURE.md),
  [Matches feed workflow](../matches-feed-workflow.md)

## Context

The product has two different "find vacancies" experiences that are easy to
conflate:

- a **persisted** stream of `VacancyMatch` rows (auto-discovered or manually
  saved), and
- a **temporary, manual** "preview search" the user runs on demand to inspect a
  source before saving anything.

Conflating them — visually or in code — leads to bugs like preview results
looking like saved matches, accidental persistence, or a preview being treated
as if it were its own Loop.

## Decision

**"Предварительный поиск" (preview search) is a temporary, manual check. It is
NOT a Loop and it never persists matches automatically.**

1. **Preview is not a Loop.** It is an action run *within* a Loop's context (or
   the Create-Loop flow), shown as a secondary, collapsible block. It must never
   be presented as a separate saved Loop/“cycle”.
2. **No automatic persistence.** A preview (dry-run discovery) writes **zero**
   rows to `vacancy_matches`. Persisting a previewed vacancy is always an
   explicit user action ("save as match" / "save as application"). This boundary
   is guarded by an integration test
   (`test_dry_run_writes_no_vacancy_matches`).
3. **Persisted `VacancyMatch` is the source of truth.** The Matches page and
   Loop Details "Top Matches" are built **only** from persisted matches (Model
   A). Preview results are never mixed into those lists.
4. **Preview may show a score.** Because preview and persisted matches are scored
   by the same core (see [ADR-001](ADR-001-match-score-ownership.md)), a preview
   item can display the same 0–100 score / relevance and matched-vs-missing
   terms — but it stays in the preview block, visually and conceptually separate
   from persisted matches.

## User-facing terminology (exact)

Use these strings verbatim:

- **"Предварительный поиск"**
- **"Предварительный поиск — не сохраняется автоматически"**

Do **not** use wording like **"предварительный цикл"** (it implies preview is a
Loop). The empty state should be calm and helpful, e.g.
«Вакансии не найдены. Попробуйте уточнить профессию, локацию или ключевые
слова.» — not an alarming error.

## Consequences

- The preview block is implemented as a disclosure inside Loop Details / Create
  Loop, clearly labelled as not-auto-saved.
- Saving from preview goes through the explicit `from-preview` endpoints, which
  also score and dedupe the new row.
- Any future redesign of preview must preserve this separation and terminology.
