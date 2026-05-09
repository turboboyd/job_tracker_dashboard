import assert from "node:assert/strict";

import {
  createEmptyStatusCounts,
  diffDays,
  medianDays,
  normalizeAppStatus,
  parseMs,
} from "../dashboardTimeSeries.shared";

function test(_name: string, run: () => void) {
  run();
}

test("parseMs accepts numbers, ISO strings, Firestore-like timestamps and rejects invalid values", () => {
  assert.equal(parseMs(1_700_000_000_000), 1_700_000_000_000);
  assert.equal(parseMs("2026-01-02T00:00:00.000Z"), Date.parse("2026-01-02T00:00:00.000Z"));
  assert.equal(parseMs({ toMillis: () => 1234 }), 1234);
  assert.equal(parseMs({ seconds: 12, nanoseconds: 999 }), 12_000);
  assert.equal(parseMs("not a date"), null);
  assert.equal(parseMs({ toMillis: () => "1234" }), null);
  assert.equal(parseMs(undefined), null);
});

test("diffDays returns rounded absolute day distance", () => {
  assert.equal(diffDays(0, 24 * 60 * 60 * 1000), 1);
  assert.equal(diffDays(0, 36 * 60 * 60 * 1000), 2);
  assert.equal(diffDays(36 * 60 * 60 * 1000, 0), 2);
});

test("medianDays ignores invalid numbers and rounds even-length medians", () => {
  assert.equal(medianDays([7, Number.NaN, 1, 3]), 3);
  assert.equal(medianDays([1, 2, 4, 9]), 3);
  assert.equal(medianDays([Number.POSITIVE_INFINITY]), null);
  assert.equal(medianDays([]), null);
});

test("normalizeAppStatus keeps valid status keys and falls back to SAVED", () => {
  assert.equal(normalizeAppStatus("APPLIED"), "APPLIED");
  assert.equal(normalizeAppStatus("UNKNOWN"), "SAVED");
  assert.equal(normalizeAppStatus(null), "SAVED");
});

test("createEmptyStatusCounts initializes independent zero counters", () => {
  const counts = createEmptyStatusCounts();

  assert.equal(counts.SAVED, 0);
  assert.equal(counts.OFFER_ACCEPTED, 0);
  assert.equal(counts.GHOSTING, 0);

  counts.SAVED = 3;
  assert.equal(createEmptyStatusCounts().SAVED, 0);
});
