import assert from "node:assert/strict";

import type { ApplicationsRepo } from "src/features/applications";

import {
  buildCreateApplicationPayload,
  canSubmitApplicationForm,
  loadApplicationsList,
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
    companyName: "Acme",
    roleTitle: "Frontend Engineer",
    vacancyUrl: "",
    source: "",
    rawDescription: "",
    ...patch,
  };
}

function row(id: string): AppRow {
  return { id, data: {} as AppRow["data"] };
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

test("canSubmitApplicationForm requires trimmed company and role", () => {
  assert.equal(canSubmitApplicationForm(form()), true);
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
        companyName: "  Acme GmbH  ",
        roleTitle: "  Backend Engineer  ",
        vacancyUrl: "   ",
        source: "   ",
        rawDescription: "   ",
      }),
    ),
    {
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
        rawDescription: " React role ",
      }),
    ),
    {
      companyName: "Acme",
      roleTitle: "Frontend Engineer",
      vacancyUrl: "https://example.test/job",
      source: "LinkedIn",
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

test("loadApplicationsList routes all pipeline, today, and followups views to dedicated queries", async () => {
  const calls: string[] = [];
  const repo = createRepo({
    queryAllActiveApplications: async (_userId, limit) => {
      calls.push(`all:${limit}`);
      return [row("all")];
    },
    queryTodayTopPriority: async (_userId, limit) => {
      calls.push(`today:${limit}`);
      return [row("today")];
    },
    queryFollowUpsDue: async (_userId, limit) => {
      calls.push(`followups:${limit}`);
      return [row("followups")];
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

  assert.deepEqual(allRows.map((item) => item.id), ["all"]);
  assert.deepEqual(todayRows.map((item) => item.id), ["today"]);
  assert.deepEqual(followupRows.map((item) => item.id), ["followups"]);
  assert.deepEqual(calls, ["all:500", "today:50", "followups:50"]);
});
