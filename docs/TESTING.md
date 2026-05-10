# Testing Guide

The project currently uses a lightweight TypeScript test harness for stable pure modules. This keeps regression coverage fast while the architecture is still being cleaned up.

## Commands

Authentication/domain tests:

```bash
npm run test:auth
```

Core pure tests:

```bash
npm run test:core
```

Full project gate:

```bash
npm run check
```

## What to test first

Prioritize pure functions and stable contracts:

- status constants and status normalization;
- Firestore mappers and sanitizers;
- dashboard summary/time-series calculations;
- board ordering and drag/drop helpers;
- match formatting helpers;
- URL/search-param helpers.

## What not to test first

Avoid starting with broad UI or integration tests while refactoring is still active. They are useful later, but they are more expensive to maintain during structural cleanup.

## Test location

Tests should be colocated with the code they protect:

```txt
src/entities/application/model/__tests__/
src/pages/DashboardPage/model/__tests__/
src/pages/BoardPage/model/__tests__/
```

## Test style

Keep tests focused:

- one behavior per test case;
- clear input and expected output;
- no Firebase/network calls;
- no DOM dependency for pure model tests;
- no hidden reliance on test order.

## Adding a new core test area

When a new pure module becomes stable, add its root to `test:core` in `package.json` if it is not already covered by an existing root.

Example:

```json
{
  "scripts": {
    "test:core": "node scripts/run-ts-tests.cjs src/entities/application src/pages/DashboardPage src/pages/BoardPage"
  }
}
```
