# Job Tracker Dashboard

React + TypeScript application for organizing and analyzing the job search process.

The project is intentionally structured as a maintainable frontend codebase: strict TypeScript, Feature-Sliced Design inspired layers, Firebase integration, architecture checks, lightweight pure-module tests and documented onboarding rules.

## What the app does

The app helps track job applications as a measurable funnel:

```txt
Applied -> HR Contact -> Technical Interview -> Final Interview -> Offer / Rejected
```

Main areas:

- authentication with Firebase Auth;
- application tracking;
- loops for organizing job-search cycles;
- matches with filtering and pagination;
- Kanban board with drag and drop;
- dashboard analytics;
- English, Russian and German translations;
- light/dark theme.

## Tech stack

Core:

- React 18;
- TypeScript;
- React Router;
- Redux Toolkit;
- Firebase Auth;
- Firestore.

UI and forms:

- Tailwind CSS;
- Radix UI;
- Lucide icons;
- Formik;
- Yup;
- dnd-kit.

Tooling:

- Webpack;
- ESLint;
- dependency-cruiser;
- madge;
- jscpd;
- lightweight TypeScript test runner.

## Project structure

```txt
src/
  app/       application bootstrap, providers, store, router, layouts
  pages/     route-level screens and page controllers
  features/  user actions and use cases
  entities/  domain models and domain-specific API/UI
  shared/    generic UI, helpers, config and infrastructure
```

The dependency direction is:

```txt
app -> pages -> features -> entities -> shared
```

External imports should use public entry points such as:

```ts
import { Button } from "src/shared/ui";
import { authReducer } from "src/entities/auth";
import { LogoutButton } from "src/features/auth";
```

Detailed architecture rules are documented in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Getting started

Install dependencies:

```bash
npm ci
```

Create or update `.env` with Firebase values:

```env
FIREBASE_API_KEY=
FIREBASE_AUTH_DOMAIN=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
FIREBASE_STORAGE_BUCKET=
FIREBASE_MESSAGING_SENDER_ID=
PUBLIC_URL=/job_tracker_dashboard
```

Start development server:

```bash
npm run dev
```

Build production bundle:

```bash
npm run build
```

## Quality commands

Run the full gate:

```bash
npm run check
```

Run focused checks:

```bash
npm run typecheck
npm run lint
npm run test:auth
npm run test:core
npm run check:local-imports
npm run check:structure-contract
npm run check:public-api-imports
npm run check:pages-boundaries
npm run check:layer-boundaries
npm run check:arch
npm run check:docs
npm run check:doc-references
npm run check:quality-gate
npm run check:architecture
```

## Cleanup commands

List safe generated/refactor cleanup targets:

```bash
npm run cleanup:repo:list
```

Delete safe cleanup targets:

```bash
npm run cleanup:repo
```

The cleanup script must not delete `.env` or `.env.example`.

## Documentation

- [`CONTRIBUTING.md`](CONTRIBUTING.md) — contribution workflow and safe refactoring sequence.
- [`docs/PR_REVIEW_CHECKLIST.md`](docs/PR_REVIEW_CHECKLIST.md) — review checklist for architecture-safe changes.
- [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md) — final verification workflow and command contract.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — layer rules, public API rules and ownership boundaries.
- [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) — fast orientation map for the codebase.
- [`docs/CODE_PLACEMENT.md`](docs/CODE_PLACEMENT.md) — practical rules for where each kind of code belongs.
- [`docs/GLOSSARY.md`](docs/GLOSSARY.md) — shared vocabulary for architecture, domain and review terms.
- [`docs/ONBOARDING.md`](docs/ONBOARDING.md) — how to run the project and where to place code.
- [`docs/TESTING.md`](docs/TESTING.md) — testing strategy and current test commands.
- [`docs/firestore-contract.md`](docs/firestore-contract.md) — Firestore-related contract notes.
- [`docs/refactor/PROGRESS.md`](docs/refactor/PROGRESS.md) — refactor progress log.
- [`docs/refactor/DECISIONS.md`](docs/refactor/DECISIONS.md) — refactor decisions log.

## License

ISC
