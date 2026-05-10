# Refactor Decisions

## Phase 4 — Shared detox

### Decision 1
`shared/api/rtk` keeps only generic state helpers. Auth-specific state requirements move to `entities/auth/lib`.

### Decision 2
Header translation JSON is shared application text, not widget-owned implementation detail. Ownership moved to `shared/locales/header`.

### Decision 3
`LanguageSelectConnected` is a connected container and belongs to `features/i18n`. `shared/ui` keeps only the dumb `LanguageSelect` component and language metadata.

## Phase 5 — Public API normalization (step 2)

### Decision 1
`src/features/applications/index.ts` is the only public entry for external consumers. `firestoreApplications.ts` remains an internal facade file until the later applications split phase.

### Decision 2
This step normalizes imports only. Firestore file decomposition (`queries`, `mutations`, `history`, `mappers`, `sanitizers`) is intentionally deferred to Phase 6.


## Phase 5 — Public API normalization (step 3)

### Decision 1
`src/features/cvVersions/index.ts` is the only public entry for external consumers. `firestoreCvVersions.ts` remains internal implementation until a later service split becomes necessary.

### Decision 2
`pages/CvCheckerPage` must stay a thin screen wrapper. The current production CV checker implementation now lives in `features/cv-checker/ui/CvCheckerPage.tsx`, and the page consumes it through `src/features/cv-checker`.

### Decision 3
The existing simplified CV checker component was not used as the contract source because that would have changed business behavior. The stable public API was built around the current page behavior instead.


## Phase 6 — Applications split (step 1)

### Decision 1
`src/features/applications/firestore/api.ts` stays as a compatibility facade while internal responsibilities are moved to `queries.ts` and `mutations.ts`. External consumers must continue importing through `src/features/applications`.

## Phase 6 — Applications split (step 2)

### Decision 1
Firestore document casting, create-doc assembly and legacy status translation are owned by `mappers.ts`, not by `queries.ts` or `mutations.ts` inline blocks.

### Decision 2
Payload cleanup for Firestore writes is owned by `sanitizers.ts`. Upper orchestration files (`mutations.ts`, `history.ts`, `user.ts`) must not call low-level `stripUndefinedDeep` directly.

- MatchesPage pure derivations (reset key, paging slice, loop/status/platform option builders, match lookup) now live in `pages/MatchesPage/model/matchesViewModel.ts`; controller remains orchestration-only.

## Phase 11 — Tests (step 1)

### Decision 1
The first test step uses a lightweight `ts-node` harness instead of introducing a full test framework before the refactor is finished. The goal is fast regression coverage for stable pure contracts, not broad infrastructure rollout.

## Phase 11 — Tests (step 2)

### Decision 1
Dashboard testing starts from pure aggregation/time-series modules only. UI, hooks and integration behavior remain intentionally out of scope until the remaining cleanup work is finished.
