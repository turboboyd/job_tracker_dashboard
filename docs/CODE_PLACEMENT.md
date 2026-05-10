# Code Placement Guide

Use this guide when deciding where a new file or refactored code should live. For vocabulary, use `docs/GLOSSARY.md`.

## Main decision tree

```txt
Is it application wiring?
  -> src/app

Is it a route-level screen?
  -> src/pages

Is it a user action or use case?
  -> src/features

Is it a domain concept?
  -> src/entities

Is it generic and reusable without business meaning?
  -> src/shared
```

## Put code in `app` when

The code configures the application itself:

- root app component;
- providers;
- router setup;
- store setup;
- app layout shell;
- startup listeners;
- dependency/gateway registration.

Do not put business calculations or page-specific UI in `app`.

## Put code in `pages` when

The code belongs to a specific route:

- page component;
- page-specific controller hook;
- page-specific local view model;
- page-specific empty/loading/error state;
- page-specific composition of sections.

If code becomes reusable across pages, move it down to `features`, `entities` or `shared` depending on ownership.

## Put code in `features` when

The code represents a user action or workflow:

- login/register/logout UI flow;
- application create/update/delete orchestration;
- CV checker flow;
- language switching UI;
- any workflow that combines several entities.

Features may import from `entities` and `shared`. Features must not import from `pages` or `app`.

## Put code in `entities` when

The code belongs to a domain concept:

- domain type;
- domain constant;
- domain status or enum-like union;
- reducer/selectors for one entity;
- entity-specific API helper;
- entity-specific formatting or validation;
- small UI component that directly represents the entity.

Entities may import from `shared`. Entities must not import from `features`, `pages` or `app`.

## Put code in `shared` when

The code is generic and has no product-specific meaning:

- Button, Card, Dialog, chart primitive;
- generic form field;
- date/string/url helper;
- Firebase app initialization;
- route constants;
- base API setup;
- generic storage/firestore helper.

Do not put application statuses, match formatting, loop logic or auth workflows in `shared`.

## Folder names inside a slice

Use these names consistently:

| Folder | Purpose |
| --- | --- |
| `api` | Data access or API integration owned by the slice |
| `model` | Types, reducers, selectors, stateful hooks, pure calculations |
| `ui` | React components owned by the slice |
| `lib` | Pure helpers owned by the slice |
| `locales` | Translations owned by the slice/page |
| `__tests__` | Colocated tests for nearby code |
| `_internal` | Local implementation details not meant for public imports |

## Public API rules

Every externally consumed slice should expose `index.ts`.

Good:

```ts
import { Button } from "src/shared/ui";
import { authReducer } from "src/entities/auth";
import { LogoutButton } from "src/features/auth";
```

Bad:

```ts
import { Button } from "src/shared/ui/Button/Button";
import { authReducer } from "src/entities/auth/model/authSlice";
import { LogoutButton } from "src/features/auth/ui/LogoutButton/LogoutButton";
```

Relative imports are allowed inside the same slice. Cross-slice imports should use public entry points.

## Page slimming rule

A page file should mostly compose other pieces. When a page grows, split it like this:

```txt
src/pages/SomePage/
  SomePage.tsx
  index.ts
  model/
    useSomePageController.ts
    somePage.helpers.ts
  ui/
    SomePageSection.tsx
  lib/
    somePageFormatting.ts
```

Move code by responsibility:

| Problem | Move to |
| --- | --- |
| Pure calculation specific to one page | `pages/SomePage/model` or `pages/SomePage/lib` |
| Reusable domain calculation | `entities/<entity>/lib` or `entities/<entity>/model` |
| Workflow using several entities | `features/<feature>` |
| Generic helper | `shared/lib` |
| Generic visual primitive | `shared/ui` |

## Firestore boundary rule

Raw Firestore document shapes should stay near Firestore code.

Preferred layout:

```txt
src/features/applications/firestore/queries.ts
src/features/applications/firestore/mutations.ts
src/features/applications/firestore/mappers.ts
src/features/applications/firestore/sanitizers.ts
src/entities/application/model
```

Pages and UI should work with domain types, not raw Firestore documents.

## Testing placement

Put tests next to the code they protect:

```txt
src/entities/application/model/__tests__/status.normalization.test.ts
src/pages/BoardPage/model/__tests__/order.test.ts
src/features/applications/firestore/__tests__/mappers-sanitizers.test.ts
```

Start with pure logic, mappers, formatters and reducers/selectors. Add UI tests only when the underlying architecture is stable.

## Before handing off a refactor

Use [`PR_REVIEW_CHECKLIST.md`](PR_REVIEW_CHECKLIST.md) to verify that the change did not weaken layer ownership, public API boundaries, Firestore boundaries or newcomer documentation.
