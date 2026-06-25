import assert from "node:assert/strict";

import type { TFunction } from "i18next";

import {
  getLoopStatusClassName,
  getLoopStatusLabel,
  getMetricValueClass,
  readPageParam,
  readTabParam,
  writeLoopsSearch,
} from "../loopListView.helpers";

function test(_name: string, run: () => void) {
  run();
}

// Minimal i18next stub: return the provided fallback string.
const t = ((_key: string, fallback: string) => fallback) as unknown as TFunction;

test("readTabParam resolves known tabs and defaults to active", () => {
  assert.equal(readTabParam("?tab=archive"), "archive");
  assert.equal(readTabParam("?tab=paused"), "paused");
  assert.equal(readTabParam("?tab=bogus"), "active");
  assert.equal(readTabParam(""), "active");
});

test("readPageParam reads a page number or null when absent", () => {
  assert.equal(readPageParam("?page=3"), 3);
  assert.equal(readPageParam("?page=2&tab=paused"), 2);
  assert.equal(readPageParam(""), null);
  assert.equal(readPageParam("?tab=archive"), null);
});

test("writeLoopsSearch merges page/tab and treats active as the absent default", () => {
  assert.equal(writeLoopsSearch("", { page: 2 }), "?page=2");
  assert.equal(writeLoopsSearch("?tab=archive", { page: 3 }), "?tab=archive&page=3");
  assert.equal(writeLoopsSearch("", { tab: "paused" }), "?tab=paused");
  // The "active" tab is represented by the absence of the param.
  assert.equal(writeLoopsSearch("?tab=paused", { tab: "active" }), "");
  assert.equal(writeLoopsSearch("?page=5", { tab: "active" }), "?page=5");
});

test("writeLoopsSearch does not mutate the input string", () => {
  const input = "?tab=archive";
  const out = writeLoopsSearch(input, { page: 4 });
  assert.equal(input, "?tab=archive");
  assert.equal(out, "?tab=archive&page=4");
});

test("getMetricValueClass prefers accent, then green, else the default tone", () => {
  assert.equal(getMetricValueClass({ accent: true }), "text-primary");
  assert.equal(getMetricValueClass({ green: true }), "text-emerald-600");
  assert.equal(getMetricValueClass({}), "text-foreground");
  // accent wins over green.
  assert.equal(getMetricValueClass({ accent: true, green: true }), "text-primary");
});

test("getLoopStatusClassName maps each status to a distinct, stable badge style", () => {
  const active = getLoopStatusClassName("active");
  const paused = getLoopStatusClassName("paused");
  const archived = getLoopStatusClassName("archived");

  assert.equal(active.startsWith("bg-emerald-100"), true);
  assert.equal(paused.startsWith("bg-amber-100"), true);
  assert.equal(archived, "bg-muted text-muted-foreground");
  assert.equal(new Set([active, paused, archived]).size, 3);
});

test("getLoopStatusLabel returns the per-status fallback label", () => {
  assert.equal(getLoopStatusLabel("active", t), "Active");
  assert.equal(getLoopStatusLabel("paused", t), "Paused");
  assert.equal(getLoopStatusLabel("archived", t), "Archived");
});
