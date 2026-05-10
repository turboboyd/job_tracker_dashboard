# Quality Gate

The quality gate is the final project health check. It combines TypeScript, linting, tests, documentation validation and architecture guards into one repeatable workflow.

Use it before handing off changed files, opening a pull request or merging cleanup work.

## Main command

```bash
npm run check
```

This command is the source of truth for project readiness.

It runs these groups:

```txt
1. TypeScript and linting
2. Core test suites
3. package.json script validation
4. documentation validation
5. documentation reference validation
6. quality-gate contract validation
7. architecture boundary validation
```

## Architecture-only command

When the change is only about imports, folder ownership or public APIs, run:

```bash
npm run check:architecture
```

This command verifies:

```txt
- required source layers exist
- entities/features/shared public entry points exist
- local imports resolve
- cross-slice imports use public APIs
- pages do not import forbidden internals
- layer direction is preserved
- dependency-cruiser architecture rules pass
```

## Quality-gate contract command

To verify that `package.json`, docs and cleanup rules still describe the same workflow, run:

```bash
npm run check:quality-gate
```

This script checks that:

```txt
- npm run check contains the required verification groups
- npm run check:architecture contains the required architecture checks
- documentation references the quality gate
- cleanup targets do not include .env or .env.example
```

## Focused commands

Use focused commands while developing:

```bash
npm run typecheck
npm run lint
npm run test:auth
npm run test:core
npm run check:docs
npm run check:doc-references
npm run check:structure-contract
npm run check:public-api-imports
npm run check:local-imports
npm run check:pages-boundaries
npm run check:layer-boundaries
npm run check:arch
```

Then finish with:

```bash
npm run check
```

## Rule for generated files

Generated output is not source code. Do not edit it manually and do not treat it as part of the app architecture.

Safe cleanup commands:

```bash
npm run cleanup:repo:list
npm run cleanup:repo
```

The cleanup workflow must not delete `.env` or `.env.example`.

## When the gate fails

Fix failures in this order:

```txt
1. TypeScript errors
2. lint errors
3. failing tests
4. broken package/doc references
5. structure/public API violations
6. layer boundary violations
7. dependency/cycle/duplication reports
```

Do not bypass the failing check by weakening the rule. Update the code, docs or ownership boundary so the project stays easy to understand for the next developer.
