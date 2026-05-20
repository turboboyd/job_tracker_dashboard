import assert from "node:assert/strict";

import {
  _overrideRestAuthTokenProviderForTests,
  _resetRestAuthTokenProviderForTests,
} from "src/shared/api/rest/restClient";
import { _overrideBackendConfig, _resetBackendConfig } from "src/shared/config";

import { createRestApplicationGateway } from "../gateway";

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
    days_in_pipeline: null,
    days_since_applied: null,
    days_in_current_status: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...overrides,
  };
}

test("REST application gateway createApplication delegates to POST /applications", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    return new Response(JSON.stringify(makeApplicationDto({ id: "created-app-1" })), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const gateway = createRestApplicationGateway();
  const id = await gateway.createApplication(null as never, "user-1", {
    companyName: "Acme GmbH",
    roleTitle: "Frontend Engineer",
  });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications");
  assert.equal(requestedMethod, "POST");
  assert.equal(id, "created-app-1");
});

test("REST application gateway updateApplicationWithHistory uses PATCH by default", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedBody: unknown;

  globalThis.fetch = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedBody = JSON.parse(String(init?.body));
    return new Response(JSON.stringify(makeApplicationDto()), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const gateway = createRestApplicationGateway();
  await gateway.updateApplicationWithHistory(
    null as never,
    "user-1",
    "app-1",
    { "notes.currentNote": "Updated" },
    () => [],
  );

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "PATCH");
  assert.deepEqual(requestedBody, { current_note: "Updated" });
});

test("REST application gateway archived=true patch uses backend DELETE archive endpoint", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedBody: NonNullable<Parameters<typeof fetch>[1]>["body"] | null | undefined = "unexpected";

  globalThis.fetch = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedBody = init?.body;
    return new Response(null, { status: 204 });
  }) as typeof fetch;

  const gateway = createRestApplicationGateway();
  await gateway.updateApplicationWithHistory(
    null as never,
    "user-1",
    "app-1",
    { archived: true },
    () => [],
  );

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "DELETE");
  assert.equal(requestedBody, undefined);
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

run().finally(() => {
  globalThis.fetch = originalFetch;
  _resetBackendConfig();
  _resetRestAuthTokenProviderForTests();
});
