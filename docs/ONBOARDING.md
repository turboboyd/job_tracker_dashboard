# Onboarding Guide

This guide explains how to run the project and how to navigate the codebase without knowing the whole application in advance.

## 1. Install dependencies

Use the lockfile-based install:

```bash
npm ci
```

## 2. Environment variables

Create or update the local `.env` file with Firebase values:

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_URL=/job_tracker_dashboard
```

Do not commit real secrets or personal Firebase project values.

## 3. Start the app

```bash
npm run dev
```

The app is served through the custom Webpack development server.

## 4. Build the app

```bash
npm run build
```

The generated production output is not source code and should not be edited manually.

## 5. Run quality checks

Before opening a pull request or sharing a changed archive, read [`QUALITY_GATE.md`](QUALITY_GATE.md) and run:

```bash
npm run check
```

For smaller focused checks:

```bash
npm run typecheck
npm run lint
npm run test:auth
npm run test:core
npm run check:local-imports
npm run check:public-api-imports
npm run check:pages-boundaries
npm run check:layer-boundaries
npm run check:arch
npm run check:docs
npm run check:doc-references
npm run check:structure-contract
npm run check:architecture
npm run check:quality-gate
```

## 6. Where to place code

Use this decision table:

| Code type | Place it here |
| --- | --- |
| App bootstrap, providers, store, router | `src/app` |
| Route-level screen composition | `src/pages` |
| User action or use case | `src/features` |
| Domain model, domain constants, entity helpers | `src/entities` |
| Generic UI, generic helpers, config, infrastructure | `src/shared` |

## 7. Import rule

When importing from another slice, use its public API.

Good:

```ts
import { Button } from "src/shared/ui";
import { ApplicationStatus } from "src/entities/application";
import { LoginForm } from "src/features/auth";
```

Bad:

```ts
import { Button } from "src/shared/ui/Button/Button";
import { ApplicationStatus } from "src/entities/application/model/types";
import { LoginForm } from "src/features/auth/ui/LoginForm/LoginForm";
```

Relative imports are fine inside the same slice. Cross-slice imports should go through public entry points.

## 8. Adding a page

A new page should normally look like this:

```txt
src/pages/NewPage/
  NewPage.tsx
  index.ts
```

If it grows, split it:

```txt
src/pages/NewPage/
  NewPage.tsx
  model/
  ui/
  lib/
  index.ts
```

Keep reusable business logic out of the page. Move it into the correct feature/entity/shared location.

## 9. Adding a feature

A feature should have a public entry:

```txt
src/features/some-feature/
  index.ts
  model/
  ui/
  lib/
```

Only export the stable contract from `index.ts`. Do not export every internal helper by default.

## 10. Adding an entity

An entity should have a public entry:

```txt
src/entities/some-entity/
  index.ts
  model/
  api/
  lib/
  ui/
```

Use `model` for domain types, constants, reducers and selectors. Use `lib` for pure domain helpers. Use `api` for entity-specific data access helpers.

## 11. Adding tests

Prefer colocated tests near the code they protect:

```txt
src/entities/application/model/__tests__/status.normalization.test.ts
src/pages/DashboardPage/model/__tests__/dashboardAggregations.test.ts
src/pages/BoardPage/model/__tests__/order.test.ts
```

Use tests first for pure logic and stable contracts.

## 12. Cleanup commands

To see safe cleanup targets:

```bash
npm run cleanup:repo:list
```

To remove safe generated/refactor artifacts:

```bash
npm run cleanup:repo
```

The cleanup script must not delete `.env` or `.env.example`.

## 13. First-day reading path

For a new developer, read the docs in this order:

```txt
1. README.md
2. CONTRIBUTING.md
3. docs/PROJECT_MAP.md
4. docs/CODE_PLACEMENT.md
5. docs/ARCHITECTURE.md
6. docs/GLOSSARY.md
7. docs/TESTING.md
8. docs/QUALITY_GATE.md
9. docs/PR_REVIEW_CHECKLIST.md
```

Then open the code in this order:

```txt
1. src/main.tsx
2. src/app/App.tsx
3. src/pages/index.ts
4. one page folder, for example src/pages/ApplicationsPage
5. the related feature/entity folders used by that page
```

## 14. Before changing code

Use this checklist:

```txt
1. Identify the owner: app, pages, features, entities or shared.
2. Check whether the target slice already has an index.ts public API.
3. Keep imports through public entry points when crossing slice boundaries.
4. Add or update colocated tests for pure logic.
5. Run npm run check.
6. Check docs/PR_REVIEW_CHECKLIST.md before handing off the change.
7. Update docs if a responsibility or rule changes.
```

## 15. Common mistakes to avoid

```txt
- Do not put business rules into shared.
- Do not import another slice's internal model/api/ui/lib files.
- Do not put Firestore document shapes into UI components.
- Do not make pages responsible for reusable workflows.
- Do not add abstractions before there are at least two real use cases.
- Do not edit generated build output.
```
