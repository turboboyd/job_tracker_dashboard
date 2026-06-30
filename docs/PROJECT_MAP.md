# Project Map

This file is a fast orientation map for developers who open the project for the first time. It explains what each top-level area owns and where to start reading.

## Source layout

```txt
src/
  app/       application startup and wiring
  pages/     route-level screens
  features/  user actions and use cases
  entities/  domain concepts
  shared/    generic reusable building blocks
```

The main rule is dependency direction:

```txt
app -> pages -> features -> entities -> shared
```

Code may import from the same layer/slice or from lower layers. Code must not import from higher layers.

## Where to start

| Goal | Start here |
| --- | --- |
| Understand application startup | `src/main.tsx`, then `src/app/App.tsx` |
| Understand providers and routing | `src/app/providers` |
| Understand page registry | `src/pages/index.ts` |
| Understand authentication | `src/entities/auth`, `src/features/auth` |
| Understand applications | `src/entities/application`, `src/features/applications`, `src/pages/ApplicationsPage` |
| Understand board behavior | `src/pages/BoardPage` |
| Understand dashboard calculations | `src/pages/DashboardPage/model` |
| Understand loops | `src/entities/loop`, `src/pages/LoopsPage` |
| Understand matches | `src/entities/loopMatch`, `src/pages/MatchesPage` |
| Understand shared UI primitives | `src/shared/ui` |
| Understand shared infrastructure | `src/shared/api`, `src/shared/config`, `src/shared/lib` |

## Layer ownership

### `src/app`

Owns application wiring:

- root React app component;
- root providers;
- router setup;
- layout wiring;
- Redux store setup;
- startup listeners and gateway registration.

`app` should not contain domain business rules. It should consume public APIs from `pages`, `features`, `entities` and `shared`.

### `src/pages`

Owns route-level composition:

- reads route/search params;
- calls hooks/controllers;
- connects page sections;
- renders page-level loading, empty and error states.

Pages can have local `model`, `ui` and `lib` folders when the code is specific to that page.

### `src/features`

Owns user actions and use cases, for example:

- auth forms and auth redirect behavior;
- application Firestore flows;
- CV checker flow;
- language selector UI.

Features may use entities and shared code. They must not depend on pages or app.

### `src/entities`

Owns domain concepts, for example:

- auth;
- application;
- loop;
- loop match;
- user;
- user settings.

Entities contain domain types, constants, selectors, reducers, entity-specific API helpers and pure domain helpers.

### `src/shared`

Owns generic code with no business ownership:

- UI primitives;
- generic form fields;
- generic helpers;
- app config;
- Firebase initialization;
- RTK base API.

`shared` must not contain job-search-specific business rules.

## Public API map

Use these public entry points when importing across slices:

```txt
src/shared/api
src/shared/config
src/shared/lib
src/shared/model
src/shared/ui

src/entities/admin-vocabulary
src/entities/application
src/entities/auth
src/entities/contact
src/entities/loop
src/entities/loopMatch
src/entities/outcome
src/entities/publicStats
src/entities/resourceFavorites
src/entities/user
src/entities/userSettings

src/features/admin
src/features/applications
src/features/auth
src/features/contacts
src/features/cv-checker
src/features/cvVersions
src/features/dashboard
src/features/discoveryRuns
src/features/i18n
src/features/loops
src/features/notifications
src/features/onboarding
src/features/reminders
src/features/userProfile
src/features/vacancyAnalysis
src/features/vacancyMatches

src/pages
```

Do not import another slice's internal `model`, `api`, `ui` or `lib` files directly.

## Common reading paths

### Login flow

```txt
src/pages/LoginPage
src/features/auth
src/entities/auth
src/shared/config
```

### Application creation/update flow

```txt
src/pages/ApplicationsPage
src/features/applications
src/entities/application
src/shared/config
```

### Board drag-and-drop flow

```txt
src/pages/BoardPage
src/pages/BoardPage/model
src/pages/BoardPage/ui/boardColumns
src/entities/application
```

### Dashboard flow

```txt
src/pages/DashboardPage
src/pages/DashboardPage/model
src/entities/application
src/entities/loop
```

## Safe refactoring workflow

1. Change one slice or one boundary at a time.
2. Keep behavior unchanged unless the task explicitly asks otherwise.
3. Run focused checks first.
4. Use `docs/GLOSSARY.md` terms in comments and reviews.
5. Run `npm run check` before sharing the result.
6. Update docs when a rule or folder responsibility changes.

## Review and contribution docs

Use these files when preparing or reviewing a change:

```txt
CONTRIBUTING.md                 safe contribution workflow
docs/PR_REVIEW_CHECKLIST.md     review checklist for architecture-safe changes
docs/GLOSSARY.md                shared review vocabulary
```
