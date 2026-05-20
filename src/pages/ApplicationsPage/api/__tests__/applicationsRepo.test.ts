import assert from "node:assert/strict";

import { _overrideBackendConfig, _resetBackendConfig } from "src/shared/config";
import {
  _overrideRestAuthTokenProviderForTests,
  _resetRestAuthTokenProviderForTests,
} from "src/shared/api/rest/restClient";

import { createApplicationsRepo } from "../applicationsRepo";

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
    days_in_pipeline: 15,
    days_since_applied: 12,
    days_in_current_status: 7,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

test("ApplicationsPage repo ensureUserDoc uses REST GET /users/me bootstrap", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedAuthorization: string | undefined;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedAuthorization = (init?.headers as Record<string, string>)
      .Authorization;

    return new Response(
      JSON.stringify({
        id: "local-user-1",
        firebase_uid: "firebase-user-1",
        email: null,
        display_name: null,
        photo_url: null,
        language: "en",
        timezone: "Europe/Berlin",
        date_format: "YYYY-MM-DD",
        created_at: "2026-01-01T00:00:00.000Z",
        updated_at: "2026-01-02T00:00:00.000Z",
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  await repo.ensureUserDoc("firebase-user-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/users/me");
  assert.equal(requestedMethod, "GET");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
});

test("ApplicationsPage repo createApplication posts REST create body and maps created row", async () => {
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
          status: "SAVED",
          current_note: "Fresh lead",
        }),
      ),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const row = await repo.createApplication("user-1", {
    companyName: "NewCo",
    roleTitle: "Backend Engineer",
    loopId: "loop-1",
    source: "LinkedIn",
    status: "SAVED",
    currentNote: "Fresh lead",
  });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications");
  assert.equal(requestedMethod, "POST");
  assert.deepEqual(requestedBody, {
    company_name: "NewCo",
    role_title: "Backend Engineer",
    loop_id: "loop-1",
    source: "LinkedIn",
    status: "SAVED",
    current_note: "Fresh lead",
  });
  assert.equal(row.id, "created-app-1");
  assert.equal(row.data.job.companyName, "NewCo");
  assert.equal(row.data.process.status, "SAVED");
});

test("ApplicationsPage repo changeStatus posts backend status transition payload", async () => {
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
      JSON.stringify(makeApplicationDto({ status: "INTERVIEW_1" })),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const row = await repo.changeStatus("user-1", "app-1", "INTERVIEW_1");

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/status",
  );
  assert.equal(requestedMethod, "POST");
  assert.deepEqual(requestedBody, {
    to_status: "INTERVIEW_1",
    sub_status: null,
    comment: null,
    correlation_id: null,
  });
  assert.equal(row.data.process.status, "INTERVIEW_1");
});

test("ApplicationsPage repo unwraps REST list envelope instead of treating response as an array", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  globalThis.fetch = (async () =>
    new Response(
      JSON.stringify({
        items: [makeApplicationDto()],
        total: 1,
        limit: 500,
        offset: 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    )) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const rows = await repo.queryAllActiveApplications("user-1", 500);

  assert.equal(Array.isArray(rows), true);
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, "app-1");
  assert.equal(rows[0]?.data.job.companyName, "Acme GmbH");
  assert.equal(rows[0]?.data.daysInCurrentStatus, 7);
});


test("ApplicationsPage repo queryApplicationsPage supports archived=true pagination", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);

    return new Response(
      JSON.stringify({
        items: [makeApplicationDto({ id: "archived-app-1", archived: true })],
        total: 3,
        limit: 20,
        offset: 20,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const result = await repo.queryApplicationsPage("user-1", {
    archived: true,
    limit: 20,
    offset: 20,
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications?archived=true&limit=20&offset=20",
  );
  assert.equal(result.total, 3);
  assert.equal(result.limit, 20);
  assert.equal(result.offset, 20);
  assert.equal(result.items[0]?.id, "archived-app-1");
});

test("ApplicationsPage repo archiveApplication calls DELETE", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";

    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  await repo.archiveApplication("user-1", "app-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "DELETE");
});

test("ApplicationsPage repo restoreApplication patches archived=false", async () => {
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
      JSON.stringify(makeApplicationDto({ archived: false })),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const row = await repo.restoreApplication("user-1", "app-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "PATCH");
  assert.deepEqual(requestedBody, { archived: false });
  assert.equal(row.data.archived, false);
});

test("ApplicationsPage repo getApplicationHistory uses REST history endpoint", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";

    return new Response(
      JSON.stringify({
        items: [
          {
            id: "history-1",
            application_id: "app-1",
            user_id: "user-1",
            actor: "USER",
            type: "COMMENT",
            from_status: null,
            to_status: null,
            field_path: null,
            old_value: null,
            new_value: null,
            comment: "Followed up",
            feedback_type: null,
            sentiment: null,
            rejection_reason_code: null,
            correlation_id: null,
            created_at: "2026-01-03T00:00:00.000Z",
          },
        ],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const repo = createApplicationsRepo(null as never);
  const rows = await repo.getApplicationHistory("user-1", "app-1", 25);

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/history?limit=25&offset=0",
  );
  assert.equal(requestedMethod, "GET");
  assert.equal(rows.length, 1);
  assert.equal(rows[0]?.id, "history-1");
  assert.equal(rows[0]?.data.comment, "Followed up");
});


test("ApplicationsPage repo keeps today/followups functions Firestore-backed", () => {
  const repo = createApplicationsRepo(null as never);

  assert.equal(typeof repo.queryTodayTopPriority, "function");
  assert.equal(typeof repo.queryFollowUpsDue, "function");
  assert.equal(typeof repo.autoMarkGhosting, "function");
});

void (async () => {
  try {
    for (const { name, run } of tests) {
      try {
        await run();
      } catch (error) {
        console.error(`Test failed: ${name}`);
        throw error;
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
    _resetBackendConfig();
    _resetRestAuthTokenProviderForTests();
  }
})();
