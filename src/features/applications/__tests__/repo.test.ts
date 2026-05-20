import assert from "node:assert/strict";

import { _overrideBackendConfig, _resetBackendConfig } from "src/shared/config";
import {
  _overrideRestAuthTokenProviderForTests,
  _resetRestAuthTokenProviderForTests,
} from "src/shared/api/rest/restClient";

import { createApplicationsRepo } from "../repo";

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];
const originalFetch = globalThis.fetch;

function installAuthUser(): void {
  _overrideRestAuthTokenProviderForTests(async () => "firebase-token-1");
}

function makeApplicationDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "app-1",
    user_id: "user-1",
    archived: false,
    company_name: "Acme GmbH",
    role_title: "Frontend Engineer",
    location_text: null,
    vacancy_url: null,
    source: null,
    employment_type: null,
    work_mode: null,
    salary: null,
    posted_at: null,
    status: "APPLIED",
    stage: "ACTIVE",
    sub_status: null,
    last_status_change_at: "2026-01-01T00:00:00.000Z",
    applied_at: null,
    applied_via: null,
    next_action_at: null,
    next_action_text: null,
    contact_attempts: 0,
    last_contact_at: null,
    last_follow_up_at: null,
    follow_up_level: 0,
    needs_follow_up: false,
    follow_up_due_at: null,
    needs_reapply_suggestion: false,
    reapply_eligible_at: null,
    reapply_reason: null,
    reminders: null,
    current_note: null,
    tags: null,
    vacancy_description: null,
    role_fingerprint: null,
    loop_id: null,
    has_loop: false,
    cv_version_id: null,
    profile_version_id: null,
    days_in_pipeline: 11,
    days_since_applied: 9,
    days_in_current_status: 4,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

function makeHistoryDto(overrides: Record<string, unknown> = {}) {
  return {
    id: "history-1",
    application_id: "app-1",
    user_id: "user-1",
    actor: "user",
    type: "COMMENT",
    from_status: null,
    to_status: null,
    field_path: null,
    old_value: null,
    new_value: null,
    comment: "Shared repo comment",
    feedback_type: null,
    sentiment: null,
    rejection_reason_code: null,
    correlation_id: null,
    created_at: "2026-01-03T00:00:00.000Z",
    ...overrides,
  };
}

test("shared repo createApplication uses REST POST /applications", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify(
        makeApplicationDto({
          id: "created-app-1",
          company_name: "NewCo",
          role_title: "Backend Engineer",
        }),
      ),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const row = await repo.createApplication("user-1", {
    companyName: "NewCo",
    roleTitle: "Backend Engineer",
    status: "SAVED",
  });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications");
  assert.equal(requestedMethod, "POST");
  assert.deepEqual(requestedBody, {
    company_name: "NewCo",
    role_title: "Backend Engineer",
    status: "SAVED",
  });
  assert.equal(row.id, "created-app-1");
  assert.equal(row.data.job.companyName, "NewCo");
});

test("shared repo getApplication uses REST GET /applications/{id}", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";

    return new Response(JSON.stringify(makeApplicationDto()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const application = await repo.getApplication("user-1", "app-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "GET");
  assert.equal(application?.job.companyName, "Acme GmbH");
});

test("shared repo queryAllActiveApplications uses REST list with archived=false", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({ items: [makeApplicationDto()], total: 1, limit: 100, offset: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const rows = await repo.queryAllActiveApplications("user-1", 500);

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications?archived=false&limit=100&offset=0&sort=updated_at_desc",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.data.daysInPipeline, 11);
});

test("shared repo queryPipelineByStatus uses REST list with status filter", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);
    return new Response(
      JSON.stringify({ items: [makeApplicationDto()], total: 1, limit: 50, offset: 0 }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const rows = await repo.queryPipelineByStatus("user-1", "APPLIED", 50);

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications?archived=false&status=APPLIED&limit=50&offset=0&sort=last_status_change_at_desc",
  );
  assert.equal(rows[0]?.data.process.status, "APPLIED");
});

test("shared repo getApplicationHistory uses REST history endpoint", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);
    return new Response(JSON.stringify({ items: [makeHistoryDto()] }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const rows = await repo.getApplicationHistory("user-1", "app-1", 25);

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/history?limit=25&offset=0",
  );
  assert.equal(rows[0]?.data.comment, "Shared repo comment");
});

test("shared repo changeStatus uses REST status payload shape", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(makeApplicationDto({ status: "INTERVIEW_1" })), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  await repo.changeStatus("user-1", "app-1", "INTERVIEW_1");

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/status",
  );
  assert.deepEqual(requestedBody, { to_status: "INTERVIEW_1" });
});

test("shared repo addComment sends REST { text }, not { comment }", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(makeHistoryDto({ comment: "New note" })), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  await repo.addComment("user-1", "app-1", "New note");

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/comments",
  );
  assert.deepEqual(requestedBody, { text: "New note" });
  assert.equal(
    Object.prototype.hasOwnProperty.call(requestedBody as Record<string, unknown>, "comment"),
    false,
  );
});

test("shared repo updateApplicationWithHistory uses REST PATCH /applications/{id}", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(makeApplicationDto({ role_title: "Lead Engineer" })), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  await repo.updateApplicationWithHistory(
    "user-1",
    "app-1",
    { "job.roleTitle": "Lead Engineer" },
    () => [],
  );

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "PATCH");
  assert.deepEqual(requestedBody, { role_title: "Lead Engineer" });
});

test("shared repo keeps unsupported Firestore-only methods available", () => {
  const repo = createApplicationsRepo(null as never);

  assert.equal(typeof repo.queryTodayTopPriority, "function");
  assert.equal(typeof repo.queryFollowUpsDue, "function");
  assert.equal(typeof repo.autoMarkGhosting, "function");
  assert.equal(typeof repo.subscribeAllActiveApplications, "function");
});

async function run() {
  for (const { name, run: runTest } of tests) {
    try {
      globalThis.fetch = originalFetch;
      _resetBackendConfig();
      _resetRestAuthTokenProviderForTests();
      await runTest();
      console.log(`✓ ${name}`);
    } catch (error) {
      console.error(`✗ ${name}`);
      throw error;
    }
  }
}

void run().finally(() => {
  globalThis.fetch = originalFetch;
  _resetBackendConfig();
  _resetRestAuthTokenProviderForTests();
});
