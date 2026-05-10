# Refactor Progress

## Phase 4 — Shared detox

### Scope
- removed auth-specific state access from `shared/api/rtk`
- moved header locale ownership from `app/widgets/header` to `shared/locales/header`
- removed duplicated connected language selector from `shared`

### Result
- `shared -> higher layers` imports removed from source tree
- connected language selector now lives only in `features/i18n`
- header translations remain unchanged at runtime

## Phase 5 — Public API normalization (step 2)

### Scope
- added root public API for `features/applications`
- moved all external consumers off `firestoreApplications.ts`
- kept Firestore implementation file internal to the feature slice

### Result
- external imports now use `src/features/applications`
- `features-public-api-only` improved for the applications feature step
- no business logic or Firestore behavior changed


## Phase 5 — Public API normalization (step 3)

### Scope
- added root public API for `features/cvVersions`
- added root public API for `features/cv-checker`
- moved `CvBuilderPage` off deep imports to `src/features/cvVersions`
- moved `pages/CvCheckerPage` to consume `src/features/cv-checker` as the stable feature entry
- preserved existing CV checker UI behavior by moving the current page implementation into the feature slice instead of switching to the legacy simplified component

### Result
- external imports no longer target `features/cvVersions/firestoreCvVersions.ts`
- `features/cv-checker` now has a real public contract used by the page layer
- page-to-feature ownership is clearer without changing runtime behavior


## Phase 6 — Applications split (step 1)

### Scope
- split `features/applications/firestore/api.ts` into `queries.ts` and `mutations.ts`
- kept `api.ts` as a thin compatibility facade
- preserved consumer-facing API

### Result
- read and write flows are separated inside the firestore slice
- `firestore/api.ts` no longer owns all applications logic
- runtime behavior remains unchanged

## Phase 6 — Applications split (step 2)

### Scope
- added explicit firestore boundary files: `mappers.ts` and `sanitizers.ts`
- moved document casting, create-doc assembly, legacy status mapping and timestamp sorting into `mappers.ts`
- moved Firestore payload cleanup into `sanitizers.ts` and updated `mutations.ts`, `history.ts`, `user.ts` to consume it

### Result
- `mutations.ts` is now orchestration-only instead of mixing mapping + sanitize + writes
- Firestore doc mapping and payload sanitization have explicit ownership inside the applications slice
- consumer API and business logic remain unchanged

- Phase 8 step 3: extracted MatchesPage pure view-model helpers and reduced controller to orchestration-only responsibilities.

## Phase 11 — Tests (step 1)

### Scope
- added a lightweight unit-test harness based on `ts-node` + `tsconfig-paths`
- covered stabilized pure contracts in `entities/application/status`
- covered pure URL builders in `entities/loop`
- covered pure match formatting helpers in `entities/loopMatch`

### Result
- tests started only after contract stabilization, as required by the roadmap
- low-risk pure modules now have executable regression checks without introducing a heavier test framework

## Phase 11 — Tests (step 2)

### Scope
- added pure tests for `pages/DashboardPage/model/dashboardSummary.ts`
- added pure tests for `pages/DashboardPage/model/dashboardTimeSeries.ts`
- covered timestamp parsing, day/week/month bucketing and pipeline line aggregation

### Result
- dashboard pure aggregations now have executable regression checks
- the test harness remains framework-light and isolated from UI/hooks/integration concerns
