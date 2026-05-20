# Project Glossary

This glossary gives new developers a shared vocabulary for the project. Use these terms consistently in code, docs and reviews.

## Architecture terms

| Term | Meaning in this project |
| --- | --- |
| Layer | One of the main source areas: `app`, `pages`, `features`, `entities`, `shared`. |
| Slice | A self-contained folder inside a layer, for example `src/entities/application` or `src/features/auth`. |
| Public API | The `index.ts` file that exposes the safe external contract of a slice or shared area. |
| Deep import | An import that reaches into another slice's internals, for example `src/entities/auth/model/authSlice`. |
| Owner | The layer or slice responsible for a piece of code. |
| Boundary | A rule that controls which layer or slice may import another layer or slice. |
| Review checklist | The architecture-safe handoff checklist in `docs/PR_REVIEW_CHECKLIST.md`. |
| Page composition | Route-level assembly of UI, controllers and states inside `src/pages`. |
| Use case | A user action or workflow owned by `src/features`. |
| Domain model | Business-specific types, constants and rules owned by `src/entities`. |
| Generic helper | Reusable code with no business meaning, owned by `src/shared`. |

## Application terms

| Term | Meaning in this project |
| --- | --- |
| Application | A tracked job application. Domain ownership: `src/entities/application`. |
| Loop | A job-search direction or stream used to group applications and matches. Domain ownership: `src/entities/loop`. |
| Match | A potential job opportunity matched to a loop. Domain ownership: `src/entities/loopMatch`. |
| Matches Feed | The `/dashboard/matches` product surface for reviewing incoming vacancy candidates before creating Applications. It may show saved Vacancy Matches and future safe preview candidates, but it does not create Applications automatically. |
| Vacancy Analysis | Saved deterministic analysis of one Vacancy Match against pasted resume text. The raw resume text is not stored. |
| Analysis Plan | Backend policy tier (`free`, `basic`, `premium`) stored on `users.analysis_plan`; it controls daily analysis quotas and optional analysis outputs. Payments are future work. |
| Discovery Source | Backend-owned source definition that can be referenced by Loop `selected_sources`. F21 exposes metadata only and does not fetch vacancies. |
| Source Adapter | Backend component that can produce bounded dry-run preview items for one Discovery Source when that source is explicitly marked runnable. F37 adds the interface; no broad external search is enabled. |
| Arbeitsagentur Adapter | First safe source adapter. It calls the public Jobsuche JSON endpoint with a tiny dry-run limit and does not save results automatically. |
| Discovery Preview Item | Temporary item returned by a dry-run discovery run. It becomes a Vacancy Match only after an explicit user save action; no application is created. |
| Match Conversion | Explicit user action that creates one Application from one saved Vacancy Match and links the match to that Application. It does not submit anything externally. |
| Board | Kanban-style view over applications and statuses. Route ownership: `src/pages/BoardPage`. |
| Dashboard | Analytical views and derived metrics over applications, loops and outcomes. Route ownership: `src/pages/DashboardPage`. |
| Pipeline | The configured sequence of stages and sub-statuses used to classify application progress. |
| Status normalization | Conversion of old or external status values into the current domain status model. |

## Data terms

| Term | Meaning in this project |
| --- | --- |
| Domain type | A type used by UI, entities and features after data has been normalized. |
| Firestore DTO | A raw Firestore document shape or write payload. Keep it near Firestore code. |
| Mapper | A function that converts Firestore DTOs to domain types or creates Firestore payloads from domain input. |
| Sanitizer | A function that removes invalid, empty or unsafe fields before writing data. |
| Gateway | A small integration adapter registered during app startup to connect one layer to an external implementation. |

## Review language

Use these short review comments consistently:

| Comment | Meaning |
| --- | --- |
| `Move to public API` | The import reaches into another slice's internals. Export the needed item from `index.ts`. |
| `Wrong owner` | The code belongs to another layer or slice. Move it according to `docs/CODE_PLACEMENT.md`. |
| `Page is too heavy` | The page mixes composition with reusable logic. Move pure logic to `model` or `lib`. |
| `Business leaked into shared` | A domain-specific rule was placed in `src/shared`. Move it to the owning entity or feature. |
| `Firestore leaked into UI` | UI code is using raw Firestore document shapes. Add or reuse a mapper. |
