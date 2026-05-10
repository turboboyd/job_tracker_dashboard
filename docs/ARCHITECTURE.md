# Architecture Guide

This project uses a Feature-Sliced Design inspired structure. The goal is not to create many folders, but to make ownership clear and prevent accidental coupling between unrelated parts of the application.

## Layer order

The source code is organized from the application shell down to generic reusable utilities:

```txt
src/
  app/       application bootstrap, providers, store wiring, router, layouts
  pages/     route-level screens and page controllers
  features/  user actions and use cases
  entities/  domain models and domain-specific UI/API
  shared/    generic infrastructure, UI primitives, helpers and config
```

Allowed dependency direction:

```txt
app -> pages -> features -> entities -> shared
```

A lower layer must not import from a higher layer. For example, `entities` must not import `features`, `pages` or `app`.

## Practical companion docs

Use these documents together with this architecture guide:

- [`PROJECT_MAP.md`](PROJECT_MAP.md) — quick map of the codebase and recommended reading paths;
- [`CODE_PLACEMENT.md`](CODE_PLACEMENT.md) — practical decision guide for where new or refactored code belongs;
- [`GLOSSARY.md`](GLOSSARY.md) — shared vocabulary for architecture and domain terms;
- [`ONBOARDING.md`](ONBOARDING.md) — setup and first-run guide for a new developer;
- [`TESTING.md`](TESTING.md) — test strategy and command reference;
- [`QUALITY_GATE.md`](QUALITY_GATE.md) — final verification workflow and command contract;
- [`PR_REVIEW_CHECKLIST.md`](PR_REVIEW_CHECKLIST.md) — checklist for validating architecture-safe pull requests;
- [`../CONTRIBUTING.md`](../CONTRIBUTING.md) — safe contribution and refactoring workflow.

## Public API rule

Every slice that is consumed from the outside should expose a public entry point:

```txt
src/features/auth/index.ts
src/entities/application/index.ts
src/shared/ui/index.ts
```

External code should import from that entry point, not from internal files.

Good:

```ts
import { LogoutButton } from "src/features/auth";
import { authReducer } from "src/entities/auth";
import { Button } from "src/shared/ui";
```

Bad:

```ts
import { LogoutButton } from "src/features/auth/ui/LogoutButton/LogoutButton";
import { authReducer } from "src/entities/auth/model/authSlice";
import { Button } from "src/shared/ui/Button/Button";
```

The `check:public-api-imports` script exists to prevent these deep imports from coming back.

## app

`app` owns application-level wiring only:

- root providers;
- Redux store setup;
- root router configuration;
- application layout;
- startup/init logic.

`app` should not know the internal file structure of entities or features. It should consume their public APIs.

## pages

A page is a route-level composition unit.

A page may:

- connect route params and search params;
- call feature/entity hooks;
- compose page sections;
- render loading, empty and error states.

A page should avoid:

- Firestore document-shape knowledge;
- large business calculations inline in JSX;
- reusable UI components that are not page-specific;
- direct imports from internal files of `shared`, `entities` or `features`.

If page logic becomes large, split it into:

```txt
PageName/
  PageName.tsx
  model/
  ui/
  lib/
  index.ts
```

Pure calculations should go into `model` or `lib` and should be tested.

## features

A feature represents a user action or use case.

Examples:

- authentication forms and auth redirect behavior;
- application creation/update flows;
- CV checker flow;
- language switching UI.

Features may import from:

```txt
entities
shared
```

Features must not import from:

```txt
app
pages
```

## entities

An entity represents a domain concept.

Examples:

- application;
- auth;
- loop;
- loop match;
- user;
- user settings.

Entities may contain:

- domain types;
- constants;
- reducers/selectors/thunks for that entity;
- entity-specific API helpers;
- pure domain helpers;
- small entity-specific UI.

Entities may import from `shared`. They should not import from `features`, `pages` or `app`.

## shared

`shared` contains reusable generic code without business ownership.

Good candidates for `shared`:

- UI primitives;
- generic form controls;
- generic chart components;
- generic date/url/firestore helpers;
- route constants;
- Firebase app initialization;
- RTK base API setup.

Bad candidates for `shared`:

- application status business rules;
- auth-specific flows;
- loop-specific logic;
- match-specific formatting;
- page-specific copy or page-specific widgets.

## Firestore boundary

Firestore implementation details should not leak into UI components.

Preferred ownership:

```txt
features/applications/firestore/queries.ts      read orchestration
features/applications/firestore/mutations.ts    write orchestration
features/applications/firestore/mappers.ts      Firestore DTO <-> domain mapping
features/applications/firestore/sanitizers.ts   payload cleanup before writes
entities/application/model/*                    domain status/types/constants
```

UI and pages should work with domain types, not raw Firestore document shapes.

## Testing policy

Start with pure functions and stable contracts:

- status normalization;
- mappers and sanitizers;
- dashboard calculations;
- board ordering helpers;
- URL/search-param helpers;
- formatting helpers.

Avoid heavy UI tests until the architecture is stable.

## Architecture checks

For the final architecture gate, run:

```bash
npm run check:architecture
npm run check
```

Use these focused commands while working:

```bash
npm run check:local-imports
npm run check:public-api-imports
npm run check:pages-boundaries
npm run check:layer-boundaries
npm run check:arch
npm run check:structure-contract
npm run check:doc-references
```

The full gate is:

```bash
npm run check
```
