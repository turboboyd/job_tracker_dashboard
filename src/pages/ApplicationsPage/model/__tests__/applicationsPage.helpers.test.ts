import assert from "node:assert/strict";

import { Timestamp } from "firebase/firestore";

import type { Loop } from "src/entities/loop";
import type { ApplicationsRepo } from "src/features/applications";

import {
  applyApplicationStatusOptimisticUpdate,
  buildCreateApplicationPayload,
  buildLoopTitleMap,
  calculateStatusCounts,
  canSubmitApplicationForm,
  filterFollowUpApplications,
  filterSelectableApplicationLoops,
  filterTodayApplications,
  getArchivedLoopCreateErrorMessage,
  getLoopTargetRole,
  isBackendLoopId,
  isLoopSelectableForApplicationCreate,
  getNextRoleTitleAfterLoopSelect,
  loadApplicationsList,
  mergeApplicationRow,
  readStoredApplicationsDisplayMode,
  resolveApplicationLoopTitle,
  writeStoredApplicationsDisplayMode,
} from "../applicationsPage.helpers";
import type { AppRow, CreateFormState } from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();

  if (result && typeof result.then === "function") {
    result.catch((error) => {
      queueMicrotask(() => {
        throw error;
      });
    });
  }
}

function form(patch: Partial<CreateFormState> = {}): CreateFormState {
  return {
    loopId: "11111111-1111-4111-8111-111111111111",
    companyName: "Acme",
    roleTitle: "Frontend Engineer",
    vacancyUrl: "",
    source: "",
    locationText: "",
    rawDescription: "",
    ...patch,
  };
}

function ts(iso: string): Timestamp {
  return Timestamp.fromDate(new Date(iso));
}

function row(id: string, patch: Partial<AppRow["data"]> = {}): AppRow {
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

function createRepo(overrides: Partial<ApplicationsRepo> = {}): ApplicationsRepo {
  const repo = {
    ensureUserDoc: async () => undefined,
    createApplication: async () => "created-id",
    queryPipelineByStatus: async () => [],
    queryAllActiveApplications: async () => [],
    queryTodayTopPriority: async () => [],
    getApplication: async () => null,
    updateApplicationWithHistory: async () => undefined,
    changeStatus: async () => undefined,
    addComment: async () => undefined,
    getApplicationHistory: async () => [],
    queryFollowUpsDue: async () => [],
    autoMarkGhosting: async () => 0,
    ...overrides,
  };

  return repo as unknown as ApplicationsRepo;
}

test("canSubmitApplicationForm requires selected loop, trimmed company and role", () => {
  assert.equal(canSubmitApplicationForm(form()), true);
  assert.equal(canSubmitApplicationForm(form({ loopId: "" })), false);
  assert.equal(canSubmitApplicationForm(form({ companyName: "   " })), false);
  assert.equal(canSubmitApplicationForm(form({ roleTitle: "   " })), false);
  assert.equal(
    canSubmitApplicationForm(form({ companyName: " Acme ", roleTitle: " Engineer " })),
    true,
  );
});

test("buildCreateApplicationPayload trims required fields and omits empty optional fields", () => {
  assert.deepEqual(
    buildCreateApplicationPayload(
      form({
        loopId: "11111111-1111-4111-8111-111111111111",
        companyName: "  Acme GmbH  ",
        roleTitle: "  Backend Engineer  ",
        vacancyUrl: "   ",
        source: "   ",
        locationText: "   ",
        rawDescription: "   ",
      }),
    ),
    {
      loopId: "11111111-1111-4111-8111-111111111111",
      companyName: "Acme GmbH",
      roleTitle: "Backend Engineer",
      status: "SAVED",
    },
  );
});

test("buildCreateApplicationPayload includes trimmed optional fields", () => {
  assert.deepEqual(
    buildCreateApplicationPayload(
      form({
        vacancyUrl: " https://example.test/job ",
        source: " LinkedIn ",
        locationText: " Berlin ",
        rawDescription: " React role ",
      }),
    ),
    {
      loopId: "11111111-1111-4111-8111-111111111111",
      companyName: "Acme",
      roleTitle: "Frontend Engineer",
      vacancyUrl: "https://example.test/job",
      source: "LinkedIn",
      locationText: "Berlin",
      status: "SAVED",
      rawDescription: "React role",
    },
  );
});

test("loadApplicationsList uses pipeline status queries and reloads after ghosting changes", async () => {
  const calls: string[] = [];
  let queryCount = 0;

  const repo = createRepo({
    queryPipelineByStatus: async (_userId, status, limit) => {
      calls.push(`pipeline:${status}:${limit}`);
      queryCount += 1;

      return queryCount === 1 ? [row("before")] : [row("after")];
    },
    autoMarkGhosting: async (_userId, rows) => {
      calls.push(`ghosting:${rows.map((item) => item.id).join(",")}`);

      return 1;
    },
  });

  const rows = await loadApplicationsList({
    activeStatus: "APPLIED",
    repo,
    userId: "user-1",
    view: "pipeline",
  });

  assert.deepEqual(rows.map((item) => item.id), ["after"]);
  assert.deepEqual(calls, ["pipeline:APPLIED:50", "ghosting:before", "pipeline:APPLIED:50"]);
});

test("loadApplicationsList filters today and followups from all active applications", async () => {
  const calls: string[] = [];
  const nowIso = new Date().toISOString();
  const today = row("today", {
    process: { ...row("base").data.process, nextActionAt: ts(nowIso) },
  });
  const followup = row("followups", {
    process: {
      ...row("base").data.process,
      needsFollowUp: true,
      followUpDueAt: ts(nowIso),
    },
  });

  const repo = createRepo({
    queryAllActiveApplications: async (_userId, limit) => {
      calls.push(`all:${limit}`);
      return [row("all"), today, followup];
    },
    autoMarkGhosting: async () => 0,
  });

  const allRows = await loadApplicationsList({
    activeStatus: "ALL",
    repo,
    userId: "user-1",
    view: "pipeline",
  });
  const todayRows = await loadApplicationsList({
    activeStatus: "SAVED",
    repo,
    userId: "user-1",
    view: "today",
  });
  const followupRows = await loadApplicationsList({
    activeStatus: "SAVED",
    repo,
    userId: "user-1",
    view: "followups",
  });

  assert.deepEqual(allRows.map((item) => item.id), ["all", "today", "followups"]);
  assert.deepEqual(todayRows.map((item) => item.id), ["today"]);
  assert.deepEqual(followupRows.map((item) => item.id), ["followups"]);
  assert.deepEqual(calls, ["all:500", "all:500", "all:500"]);
});


test("getNextRoleTitleAfterLoopSelect prefills from loop target role only when safe", () => {
  assert.equal(
    getNextRoleTitleAfterLoopSelect({
      currentRoleTitle: "",
      targetRole: "Backend Developer",
      wasManuallyEdited: false,
    }),
    "Backend Developer",
  );
  assert.equal(
    getNextRoleTitleAfterLoopSelect({
      currentRoleTitle: "  ",
      targetRole: "Backend Developer",
      wasManuallyEdited: true,
    }),
    "Backend Developer",
  );
  assert.equal(
    getNextRoleTitleAfterLoopSelect({
      currentRoleTitle: "Frontend Developer",
      targetRole: "Backend Developer",
      wasManuallyEdited: true,
    }),
    "Frontend Developer",
  );
});


test("getLoopTargetRole prefers first loop title, then canonical role, then loop name", () => {
  assert.equal(
    getLoopTargetRole({
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ausbildung 2026",
      titles: ["Fachinformatiker Anwendungsentwicklung"],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
    }),
    "Fachinformatiker Anwendungsentwicklung",
  );
  assert.equal(
    getLoopTargetRole({
      id: "loop-2",
      name: "Backend campaign",
      titles: [],
      location: "Berlin",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
      filters: {
        role: "Python Backend Developer",
        location: "Berlin",
        radiusKm: 30,
        workMode: "any",
        seniority: "junior",
        employmentType: "full_time",
        postedWithin: 30,
        includeKeywords: "",
        excludeKeywords: "",
        excludeAgencies: false,
        language: "any",
      },
    }),
    "Python Backend Developer",
  );
  assert.equal(
    getLoopTargetRole({
      id: "loop-3",
      name: "Sales B2B",
      titles: [],
      location: "Remote",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
    }),
    "Sales B2B",
  );
});



test("filterSelectableApplicationLoops excludes archived loops from create flow", () => {
  const loops: Loop[] = [
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Active",
      titles: [],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
      status: "active",
    },
    {
      id: "22222222-2222-4222-8222-222222222222",
      name: "Paused",
      titles: [],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
      status: "paused",
    },
    {
      id: "33333333-3333-4333-8333-333333333333",
      name: "Archived",
      titles: [],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
      status: "archived",
    },
    {
      id: "legacy-loop",
      name: "Legacy",
      titles: [],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
    },
  ];

  assert.deepEqual(
    filterSelectableApplicationLoops(loops).map((loop) => loop.id),
    [
      "11111111-1111-4111-8111-111111111111",
      "22222222-2222-4222-8222-222222222222",
    ],
  );
  assert.equal(
    isLoopSelectableForApplicationCreate({
      id: "33333333-3333-4333-8333-333333333333",
      status: "archived",
    }),
    false,
  );
  assert.equal(
    isLoopSelectableForApplicationCreate({
      id: "11111111-1111-4111-8111-111111111111",
      status: "active",
    }),
    true,
  );
  assert.equal(
    isLoopSelectableForApplicationCreate({
      id: "dRZtCsff5O6AWyynaisC",
      status: "active",
    }),
    false,
  );
  assert.equal(isBackendLoopId("manual"), false);
  assert.equal(isBackendLoopId("11111111-1111-4111-8111-111111111111"), true);
  assert.equal(getArchivedLoopCreateErrorMessage().includes("архиве"), true);
});

test("buildLoopTitleMap and resolveApplicationLoopTitle show loop names instead of raw ids", () => {
  const loopTitleById = buildLoopTitleMap([
    {
      id: "11111111-1111-4111-8111-111111111111",
      name: "Ausbildung Search",
      titles: [],
      location: "Wolfsburg",
      radiusKm: 30,
      remoteMode: "any",
      platforms: [],
    },
  ]);

  assert.equal(resolveApplicationLoopTitle(row("app-1", {
    loopLinkage: { loopId: "11111111-1111-4111-8111-111111111111" },
  }), loopTitleById), "Ausbildung Search");
  assert.equal(resolveApplicationLoopTitle(row("app-2", {
    loopLinkage: { loopId: "missing-loop" },
  }), loopTitleById), "Unknown loop");
  assert.equal(resolveApplicationLoopTitle(row("app-3"), loopTitleById), "—");
});

test("view mode localStorage helper saves and restores list/cards only", () => {
  const store = new Map<string, string>();
  const storage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value);
    },
  };

  assert.equal(readStoredApplicationsDisplayMode(storage), null);
  writeStoredApplicationsDisplayMode("cards", storage);
  assert.equal(readStoredApplicationsDisplayMode(storage), "cards");
  store.set("applications.viewMode", "grid");
  assert.equal(readStoredApplicationsDisplayMode(storage), null);
});

test("calculateStatusCounts counts Saved and Applied consistently", () => {
  const counts = calculateStatusCounts([
    row("saved-1", { process: { ...row("base").data.process, status: "SAVED" } }),
    row("saved-2", { process: { ...row("base").data.process, status: "SAVED" } }),
    row("applied-1", { process: { ...row("base").data.process, status: "APPLIED" } }),
  ]);

  assert.equal(counts.ALL, 3);
  assert.equal(counts.SAVED, 2);
  assert.equal(counts.APPLIED, 1);
});

test("filterTodayApplications uses nextActionAt today as the source of truth", () => {
  const now = new Date("2026-05-13T12:00:00.000Z");
  const rows = [
    row("today", { process: { ...row("base").data.process, nextActionAt: ts("2026-05-13T08:00:00.000Z") } }),
    row("tomorrow", { process: { ...row("base").data.process, nextActionAt: ts("2026-05-14T08:00:00.000Z") } }),
    row("none"),
  ];

  assert.deepEqual(filterTodayApplications(rows, now).map((item) => item.id), ["today"]);
});

test("filterFollowUpApplications uses needsFollowUp and due date as the source of truth", () => {
  const now = new Date("2026-05-13T12:00:00.000Z");
  const rows = [
    row("due", {
      process: {
        ...row("base").data.process,
        needsFollowUp: true,
        followUpDueAt: ts("2026-05-13T09:00:00.000Z"),
      },
    }),
    row("future", {
      process: {
        ...row("base").data.process,
        needsFollowUp: true,
        followUpDueAt: ts("2026-05-14T09:00:00.000Z"),
      },
    }),
    row("not-needed", {
      process: { ...row("base").data.process, needsFollowUp: false },
    }),
  ];

  assert.deepEqual(filterFollowUpApplications(rows, now).map((item) => item.id), ["due"]);
});


test("applyApplicationStatusOptimisticUpdate changes only the target status", () => {
  const rows = [row("a"), row("b", { process: { ...row("b-base").data.process, status: "APPLIED" } })];

  const updated = applyApplicationStatusOptimisticUpdate(rows, "a", "INTERVIEW_1");

  assert.equal(updated[0]?.data.process.status, "INTERVIEW_1");
  assert.equal(updated[1]?.data.process.status, "APPLIED");
  assert.equal(rows[0]?.data.process.status, "SAVED");
});

test("mergeApplicationRow replaces the backend-updated application without clearing the list", () => {
  const rows = [row("a"), row("b")];
  const backendRow = row("a", {
    job: { companyName: "Acme Updated", roleTitle: "Senior Engineer" },
    process: { ...row("a-base").data.process, status: "INTERVIEW_1" },
  });

  const updated = mergeApplicationRow(rows, backendRow);

  assert.equal(updated.length, 2);
  assert.equal(updated[0]?.data.job.companyName, "Acme Updated");
  assert.equal(updated[0]?.data.process.status, "INTERVIEW_1");
  assert.equal(updated[1]?.id, "b");
});
