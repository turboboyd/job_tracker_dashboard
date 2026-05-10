import assert from "node:assert/strict";

import type { ApplicationDoc } from "src/features/applications";

import {
  buildDashboardPlanItems,
  buildDashboardMatches,
  buildDashboardPipelineSummary,
  type DashboardApplicationsRow,
  type MatchLike,
} from "../dashboardAggregations";
import { filterDashboardMatchesByLoopsFilter } from "../dashboardData.helpers";

function test(_name: string, run: () => void) {
  run();
}

function applicationRow(
  id: string,
  subStatus: string,
  loopId?: string,
): DashboardApplicationsRow {
  return {
    id,
    data: {
      createdAt: id,
      updatedAt: `${id}:updated`,
      createdBy: "user-1",
      archived: false,
      job: {
        companyName: `${id} company`,
        roleTitle: `${id} role`,
      },
      process: {
        status: "SAVED",
        subStatus,
      },
      ...(loopId ? { loopLinkage: { loopId } } : {}),
    } as unknown as ApplicationDoc,
  };
}

test("builds dashboard matches with loop ids from application linkage", () => {
  const matches = buildDashboardMatches(
    [
      applicationRow("app-1", "APPLIED", "loop-a"),
      applicationRow("app-2", "GHOSTING"),
    ],
    {},
  );

  assert.equal(matches[0]?.loopId, "loop-a");
  assert.equal(matches[1]?.loopId, undefined);
});

test("summarizes matches by corrected board columns", () => {
  const summary = buildDashboardPipelineSummary([
    { id: "hired", status: "OFFER_ACCEPTED" },
    { id: "ghosting", status: "GHOSTING" },
    { id: "archived", status: "ARCHIVED_GENERAL" },
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.byColumn.HIRED, 1);
  assert.equal(summary.byColumn.NO_RESPONSE, 1);
  assert.equal(summary.byColumn.ARCHIVED, 1);
  assert.equal(summary.byColumn.OFFER, 0);
  assert.equal(summary.byColumn.ACTIVE, 0);
});

test("filters dashboard matches by selected loops", () => {
  const matches: MatchLike[] = [
    { id: "app-1", loopId: "loop-a" },
    { id: "app-2", loopId: "loop-b" },
    { id: "app-3" },
  ];

  assert.deepEqual(
    filterDashboardMatchesByLoopsFilter(matches, { mode: "all" }).map((match) => match.id),
    ["app-1", "app-2", "app-3"],
  );
  assert.deepEqual(
    filterDashboardMatchesByLoopsFilter(matches, {
      mode: "selected",
      selectedLoopIds: ["loop-b"],
    }).map((match) => match.id),
    ["app-2"],
  );
  assert.deepEqual(
    filterDashboardMatchesByLoopsFilter(matches, {
      mode: "selected",
      selectedLoopIds: [],
    }),
    [],
  );
});

test("builds dashboard plan items with day buckets", () => {
  const nowMs = new Date("2026-05-20T10:00:00").getTime();
  const plan = buildDashboardPlanItems(
    [
      {
        id: "overdue",
        nextActionAt: "2026-05-20T09:00:00",
        status: "APPLIED",
      },
      {
        id: "today",
        nextActionAt: "2026-05-20T15:00:00",
        status: "INTERVIEW_1",
      },
      {
        id: "tomorrow",
        nextActionAt: "2026-05-21T09:00:00",
        status: "OFFER",
      },
      {
        id: "upcoming",
        nextActionAt: "2026-05-23T09:00:00",
        status: "SAVED",
      },
    ],
    nowMs,
  );

  assert.deepEqual(
    plan.map((item) => [item.id, item.bucket]),
    [
      ["overdue", "overdue"],
      ["today", "today"],
      ["tomorrow", "tomorrow"],
      ["upcoming", "upcoming"],
    ],
  );
});
