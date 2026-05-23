import assert from "node:assert/strict";

import { Timestamp } from "firebase/firestore";

import type { Loop } from "src/entities/loop";
import type { AppRow } from "src/pages/ApplicationsPage/model/types";

import {
  buildLoopStatsById,
  filterLoopsByArchiveTab,
  filterLoopsByTab,
  getBackendLoopIdsForMatchLoading,
  getLoopStats,
  getLoopStatus,
  isApplicationApplied,
  isApplicationInterview,
  isApplicationOffer,
  isApplicationRejected,
  isApplicationSaved,
  isBackendLoopId,
  shouldShowLoopsPagination,
} from "../loopsPage.helpers";

function test(_name: string, run: () => void) {
  run();
}

function ts(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

function loop(id: string, patch: Partial<Loop> = {}): Loop {
  return {
    id,
    name: `Loop ${id}`,
    titles: ["Frontend Engineer"],
    location: "Berlin",
    radiusKm: 30,
    remoteMode: "any",
    platforms: ["linkedin"],
    ...patch,
  };
}

function app(id: string, patch: Partial<AppRow["data"]> = {}): AppRow {
  const base = {
    createdAt: ts("2026-05-13T08:00:00.000Z"),
    updatedAt: ts("2026-05-13T08:00:00.000Z"),
    createdBy: "user-1",
    archived: false,
    job: { companyName: `Company ${id}`, roleTitle: "Engineer" },
    process: {
      status: "SAVED",
      lastStatusChangeAt: ts("2026-05-13T08:00:00.000Z"),
      contactAttempts: 0,
      followUpLevel: 0,
      needsFollowUp: false,
      needsReapplySuggestion: false,
    },
  } as AppRow["data"];

  return { id, data: { ...base, ...patch } as AppRow["data"] };
}

function match(id: string, loopId: string, status = "saved") {
  return { id, loopId, status };
}

test("getLoopStatus defaults old loop documents to active", () => {
  assert.equal(getLoopStatus(loop("a")), "active");
  assert.equal(getLoopStatus(loop("b", { status: "paused" })), "paused");
});

test("filterLoopsByTab separates active/paused/archived into distinct tabs", () => {
  const loops = [loop("active"), loop("paused", { status: "paused" }), loop("archived", { status: "archived" })];

  assert.deepEqual(filterLoopsByTab(loops, "active").map((item) => item.id), ["active"]);
  assert.deepEqual(filterLoopsByTab(loops, "paused").map((item) => item.id), ["paused"]);
  assert.deepEqual(filterLoopsByTab(loops, "archive").map((item) => item.id), ["archived"]);
});

test("filterLoopsByArchiveTab (deprecated) excludes archived from active tab", () => {
  const loops = [loop("active"), loop("paused", { status: "paused" }), loop("archived", { status: "archived" })];

  assert.deepEqual(filterLoopsByArchiveTab(loops, "active").map((item) => item.id), ["active"]);
  assert.deepEqual(filterLoopsByArchiveTab(loops, "archive").map((item) => item.id), ["archived"]);
});

test("loop application status helpers map statuses to F16 counters", () => {
  assert.equal(isApplicationSaved(app("saved")), true);
  assert.equal(isApplicationApplied(app("applied", { process: { ...app("base").data.process, status: "APPLIED" } })), true);
  assert.equal(isApplicationInterview(app("interview", { process: { ...app("base").data.process, status: "INTERVIEW_1" } })), true);
  assert.equal(isApplicationOffer(app("offer", { process: { ...app("base").data.process, status: "OFFER" } })), true);
  assert.equal(isApplicationRejected(app("rejected", { process: { ...app("base").data.process, status: "REJECTED" } })), true);
  assert.equal(isApplicationApplied(app("saved-not-applied")), false);
});

test("buildLoopStatsById counts F16 loop counters by loopId", () => {
  const loops = [loop("loop-a"), loop("loop-b")];
  const rows = [
    app("saved-a", {
      loopLinkage: { loopId: "loop-a" },
      process: { ...app("base").data.process, status: "SAVED", nextActionAt: ts("2026-05-13T09:00:00.000Z") },
    }),
    app("applied-a", {
      loopLinkage: { loopId: "loop-a" },
      process: { ...app("base").data.process, status: "APPLIED", nextActionAt: ts("2026-05-14T09:00:00.000Z") },
    }),
    app("interview-b", {
      loopLinkage: { loopId: "loop-b" },
      process: { ...app("base").data.process, status: "INTERVIEW_1", nextActionAt: ts("2026-05-13T11:00:00.000Z") },
    }),
    app("offer-b", {
      loopLinkage: { loopId: "loop-b" },
      process: { ...app("base").data.process, status: "OFFER", needsFollowUp: true, followUpDueAt: ts("2026-05-13T10:00:00.000Z") },
    }),
    app("rejected-a", {
      loopLinkage: { loopId: "loop-a" },
      process: { ...app("base").data.process, status: "REJECTED" },
    }),
    app("missing", { loopLinkage: { loopId: "missing-loop" } }),
  ];
  const matches = [
    match("m1", "loop-a", "new"),
    match("m2", "loop-a", "saved"),
    match("m3", "loop-b", "converted"),
    match("m4", "loop-b", "ignored"),
    match("m5", "missing-loop", "saved"),
  ];

  const stats = buildLoopStatsById({
    loops,
    applications: rows,
    matches,
    now: new Date("2026-05-13T12:00:00.000Z"),
  });

  assert.deepEqual(getLoopStats(stats, "loop-a"), {
    applications: 3,
    saved: 1,
    applied: 1,
    interview: 0,
    offer: 0,
    rejected: 1,
    today: 1,
    followUps: 0,
    matches: 2,
  });
  assert.deepEqual(getLoopStats(stats, "loop-b"), {
    applications: 2,
    saved: 0,
    applied: 0,
    interview: 1,
    offer: 1,
    rejected: 0,
    today: 1,
    followUps: 1,
    matches: 0,
  });
  assert.deepEqual(getLoopStats(stats, "missing-loop"), {
    applications: 0,
    saved: 0,
    applied: 0,
    interview: 0,
    offer: 0,
    rejected: 0,
    today: 0,
    followUps: 0,
    matches: 0,
  });
});


test("isBackendLoopId accepts backend UUIDs and rejects legacy Firestore/demo ids", () => {
  assert.equal(isBackendLoopId("3fa85f64-5717-4562-b3fc-2c963f66afa6"), true);
  assert.equal(isBackendLoopId("demoLoop"), false);
  assert.equal(isBackendLoopId("manual"), false);
  assert.equal(isBackendLoopId("inmShOhKrxSS1m1FPtMV"), false);
});

test("getBackendLoopIdsForMatchLoading ignores legacy Firestore loop ids", () => {
  assert.deepEqual(
    getBackendLoopIdsForMatchLoading([
      loop("demoLoop"),
      loop("11111111-1111-4111-8111-111111111111"),
      loop("manual"),
      loop("dRZtCsff5O6AWyynaisC"),
      loop("22222222-2222-4222-8222-222222222222"),
    ]),
    [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ],
  );
});

test("shouldShowLoopsPagination uses page size 10 boundary", () => {
  assert.equal(shouldShowLoopsPagination(0), false);
  assert.equal(shouldShowLoopsPagination(10), false);
  assert.equal(shouldShowLoopsPagination(11), true);
  assert.equal(shouldShowLoopsPagination(11, 5), true);
});
