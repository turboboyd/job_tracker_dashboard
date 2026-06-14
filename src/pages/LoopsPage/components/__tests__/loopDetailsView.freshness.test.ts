import assert from "node:assert/strict";

import type { VacancyMatch } from "src/features/vacancyMatches";

import {
  compareMatchesByFreshness,
  selectTopFreshMatches,
  selectTopScoredMatches,
} from "../loopDetailsView.helpers";

function match(overrides: Partial<VacancyMatch> & { id: string }): VacancyMatch {
  return {
    id: overrides.id,
    userId: "u",
    loopId: "l",
    sourceUrl: `https://example.com/${overrides.id}`,
    source: overrides.source ?? "remotive",
    externalId: null,
    companyName: overrides.companyName ?? null,
    roleTitle: overrides.roleTitle ?? null,
    locationText: null,
    vacancyDescription: null,
    rawMetadata: {},
    confidence: {},
    warnings: [],
    status: overrides.status ?? "new",
    applicationId: null,
    seenAt: null,
    postedAt: overrides.postedAt ?? null,
    score: overrides.score ?? null,
    scoreVersion: overrides.scoreVersion ?? null,
    createdAt: overrides.createdAt ?? "2026-01-01T00:00:00Z",
    updatedAt: overrides.updatedAt ?? "2026-01-01T00:00:00Z",
  };
}

const ids = (items: readonly VacancyMatch[]): string[] => items.map((m) => m.id);

// 1. posted_at DESC — the more recently posted match comes first.
{
  const older = match({ id: "a", postedAt: "2026-06-01T00:00:00Z" });
  const newer = match({ id: "b", postedAt: "2026-06-07T00:00:00Z" });
  assert.deepEqual(ids(selectTopFreshMatches([older, newer])), ["b", "a"]);
}

// 2. NULLS LAST — a match WITH posted_at outranks one without, even when the
//    null-posted match has a newer updated_at.
{
  const withPosted = match({
    id: "a",
    postedAt: "2025-01-01T00:00:00Z",
    updatedAt: "2026-06-08T00:00:00Z",
  });
  const noPosted = match({ id: "b", postedAt: null, updatedAt: "2026-06-09T00:00:00Z" });
  assert.deepEqual(ids(selectTopFreshMatches([noPosted, withPosted])), ["a", "b"]);
}

// 3. posted_at null on both → fall back to updated_at DESC.
{
  const a = match({ id: "a", postedAt: null, updatedAt: "2026-06-01T00:00:00Z" });
  const b = match({ id: "b", postedAt: null, updatedAt: "2026-06-05T00:00:00Z" });
  assert.deepEqual(ids(selectTopFreshMatches([a, b])), ["b", "a"]);
}

// 4. posted_at + updated_at equal → fall back to created_at DESC.
{
  const a = match({
    id: "a",
    postedAt: null,
    updatedAt: "2026-06-01T00:00:00Z",
    createdAt: "2026-05-01T00:00:00Z",
  });
  const b = match({
    id: "b",
    postedAt: null,
    updatedAt: "2026-06-01T00:00:00Z",
    createdAt: "2026-05-09T00:00:00Z",
  });
  assert.deepEqual(ids(selectTopFreshMatches([a, b])), ["b", "a"]);
}

// 5. Full tie → stable id ASC tiebreak (mirrors backend `id ASC`).
{
  const a = match({
    id: "a",
    postedAt: null,
    updatedAt: "2026-06-01T00:00:00Z",
    createdAt: "2026-05-01T00:00:00Z",
  });
  const b = match({
    id: "b",
    postedAt: null,
    updatedAt: "2026-06-01T00:00:00Z",
    createdAt: "2026-05-01T00:00:00Z",
  });
  assert.equal(compareMatchesByFreshness(a, b) < 0, true);
  assert.deepEqual(ids(selectTopFreshMatches([b, a])), ["a", "b"]);
}

// 6. Caps at 5 and never mutates the input array.
{
  const items = ["a", "b", "c", "d", "e", "f", "g"].map((id, i) =>
    match({ id, updatedAt: `2026-06-0${i + 1}T00:00:00Z` }),
  );
  const top = selectTopFreshMatches(items, 5);
  assert.equal(top.length, 5);
  // freshest (updated 2026-06-07 .. 2026-06-03) first
  assert.deepEqual(ids(top), ["g", "f", "e", "d", "c"]);
  // input order preserved (no in-place sort)
  assert.deepEqual(ids(items), ["a", "b", "c", "d", "e", "f", "g"]);
}

// 7. limit <= 0 returns an empty list.
{
  assert.deepEqual(selectTopFreshMatches([match({ id: "a" })], 0), []);
}

// ── selectTopScoredMatches (backend-owned score, NULLS last, freshness tie) ──

// 8. Highest backend score first.
{
  const low = match({ id: "a", score: 20 });
  const high = match({ id: "b", score: 90 });
  const mid = match({ id: "c", score: 55 });
  assert.deepEqual(ids(selectTopScoredMatches([low, high, mid])), ["b", "c", "a"]);
}

// 9. NULL score sorts last, even when fresher than a scored row.
{
  const scored = match({ id: "a", score: 10, postedAt: "2025-01-01T00:00:00Z" });
  const unscored = match({ id: "b", score: null, postedAt: "2026-06-09T00:00:00Z" });
  assert.deepEqual(ids(selectTopScoredMatches([unscored, scored])), ["a", "b"]);
}

// 10. Equal scores → fall back to the freshness chain (posted_at DESC).
{
  const older = match({ id: "a", score: 50, postedAt: "2026-06-01T00:00:00Z" });
  const newer = match({ id: "b", score: 50, postedAt: "2026-06-07T00:00:00Z" });
  assert.deepEqual(ids(selectTopScoredMatches([older, newer])), ["b", "a"]);
}

// 11. Caps at limit and never mutates the input.
{
  const items = ["a", "b", "c", "d"].map((id, i) => match({ id, score: i * 10 }));
  const top = selectTopScoredMatches(items, 2);
  assert.deepEqual(ids(top), ["d", "c"]);
  assert.deepEqual(ids(items), ["a", "b", "c", "d"]);
}

console.log("loopDetailsView freshness tests passed.");
