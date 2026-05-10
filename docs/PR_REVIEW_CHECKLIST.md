# Pull Request Review Checklist

Use this checklist for every cleanup/refactor change. It keeps architecture decisions consistent and makes reviews easier for new contributors.

## 1. Scope

```txt
[ ] The change has one main purpose.
[ ] The change does not mix cleanup with new features.
[ ] The changed files belong to the same area or clearly related areas.
[ ] Unrelated formatting and renaming were avoided.
```

## 2. Layer ownership

```txt
[ ] app contains only bootstrap, providers, store, router or layout wiring.
[ ] pages contain route-level composition, not reusable business logic.
[ ] features contain user actions or use cases.
[ ] entities contain domain concepts, domain helpers and entity-specific API/UI.
[ ] shared contains only generic infrastructure, UI, config or helpers.
```

## 3. Import boundaries

```txt
[ ] Cross-slice imports use public APIs.
[ ] No external code imports another slice's internal model/api/ui/lib files.
[ ] No lower layer imports from a higher layer.
[ ] No page imports app internals.
[ ] New exports in index.ts are intentional and stable enough to expose.
```

## 4. Firestore and data boundaries

```txt
[ ] UI works with domain types, not raw Firestore document shapes.
[ ] Firestore DTOs stay near Firestore queries/mutations/mappers.
[ ] New write payloads pass through a sanitizer when needed.
[ ] Legacy values are normalized before reaching UI logic.
```

## 5. Pages and UI

```txt
[ ] Page files are still readable after the change.
[ ] Complex calculations are in model/lib helpers.
[ ] Page-specific UI stayed inside the page folder.
[ ] Reusable generic UI moved to shared/ui only if it has no business meaning.
[ ] Reusable domain UI moved to the owning entity/feature, not shared.
```

## 6. Tests

```txt
[ ] Pure helpers changed by the PR have colocated tests.
[ ] Mappers, sanitizers and status normalization changes have tests.
[ ] Tests cover important edge cases, not only the happy path.
[ ] Tests do not depend on real Firebase services.
```

## 7. Documentation

```txt
[ ] README still matches the actual stack and commands.
[ ] docs/ARCHITECTURE.md still matches the source structure.
[ ] docs/CODE_PLACEMENT.md still answers where the changed code belongs.
[ ] docs/PROJECT_MAP.md still lists public entry points accurately.
[ ] docs/GLOSSARY.md has new terms if the PR introduced them.
```

## 8. Required checks

Read [`QUALITY_GATE.md`](QUALITY_GATE.md), then run before handing off the change:

```bash
npm run check
```

For focused architecture verification:

```bash
npm run check:public-api-imports
npm run check:structure-contract
npm run check:doc-references
npm run check:local-imports
npm run check:layer-boundaries
npm run check:pages-boundaries
npm run check:architecture
npm run check:quality-gate
```

## Review comments vocabulary

Use the shared review terms from [`GLOSSARY.md`](GLOSSARY.md):

```txt
Move to public API
Wrong owner
Page is too heavy
Business leaked into shared
Firestore leaked into UI
```
