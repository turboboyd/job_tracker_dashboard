# Contributing Guide

This guide explains the expected workflow for changing the project without weakening the architecture.

## Main rule

Keep each change small, boring and easy to review.

Prefer this:

```txt
one boundary cleanup
one page refactor
one helper extraction
one test file
one docs update
```

Avoid this:

```txt
refactor many layers at once
rename unrelated files
mix cleanup with new features
move code without updating imports and docs
```

## Before editing code

1. Read [`docs/PROJECT_MAP.md`](docs/PROJECT_MAP.md) to understand the area.
2. Use [`docs/CODE_PLACEMENT.md`](docs/CODE_PLACEMENT.md) to choose the owner.
3. Check the owning slice public API, usually `index.ts`.
4. Decide whether the change needs a colocated test.
5. Keep `.env` and `.env.example` untouched unless the task explicitly says otherwise.

## Architecture workflow

When moving code, preserve the layer direction:

```txt
app -> pages -> features -> entities -> shared
```

Cross-slice imports must use public APIs.

Good:

```ts
import { Button } from "src/shared/ui";
import { ApplicationStatus } from "src/entities/application";
```

Bad:

```ts
import { Button } from "src/shared/ui/Button/Button";
import { ApplicationStatus } from "src/entities/application/model/types";
```

## Safe refactoring sequence

Use this order for cleanup work:

1. Run the focused architecture check for the area.
2. Move or rename the smallest possible unit.
3. Update public exports only when another slice needs the item.
4. Replace imports.
5. Add or update tests for pure logic.
6. Update docs if ownership rules changed.
7. Run the quality gate from [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md).

## Quality gate

The full workflow is documented in [`docs/QUALITY_GATE.md`](docs/QUALITY_GATE.md). Before sharing changes, run:

```bash
npm run check
```

If dependencies are not installed yet, start with:

```bash
npm ci
```

Useful focused checks:

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

## Pull request checklist

Use [`docs/PR_REVIEW_CHECKLIST.md`](docs/PR_REVIEW_CHECKLIST.md) before handing off a change.

A change is ready when:

```txt
- it has a clear owner
- it does not add deep imports
- it does not move business logic into shared
- it keeps pages as composition units
- tests/docs were updated when needed
- npm run check passes locally
```

## Cleanup policy

Generated and temporary files should not be treated as source code.

Safe cleanup commands:

```bash
npm run cleanup:repo:list
npm run cleanup:repo
```

The cleanup script must not delete `.env` or `.env.example`.
