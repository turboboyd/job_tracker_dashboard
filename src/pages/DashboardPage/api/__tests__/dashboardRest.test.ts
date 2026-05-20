import assert from "node:assert/strict";

import { _overrideRestAuthTokenProviderForTests, _resetRestAuthTokenProviderForTests } from "src/shared/api/rest/restClient";
import { _overrideBackendConfig, _resetBackendConfig } from "src/shared/config";

import {
  buildActivityFeedUrl,
  buildAnalyticsKpiUrl,
  getActivityFeedViaRest,
  getAnalyticsKpiViaRest,
  mapActivityFeedResponseDto,
  mapKpiResponseDto,
  type ActivityFeedResponseDto,
  type DashboardKpiResponseDto,
} from "../dashboardRest";

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];
const originalFetch = globalThis.fetch;

function installAuthUser(): void {
  _overrideRestAuthTokenProviderForTests(async () => "firebase-token-1");
}

function makeActivityFeedResponse(
  overrides: Partial<ActivityFeedResponseDto> = {},
): ActivityFeedResponseDto {
  return {
    items: [
      {
        id: "event-1",
        user_id: "user-1",
        application_id: "app-1",
        kind: "STATUS_CHANGED",
        title: "Status changed to Acme GmbH – Frontend Engineer",
        description: null,
        payload: { to_status: "INTERVIEW_1" },
        created_at: "2026-05-11T10:30:00.000Z",
      },
    ],
    ...overrides,
  };
}

function makeKpiResponse(
  overrides: Partial<DashboardKpiResponseDto> = {},
): DashboardKpiResponseDto {
  return {
    range: "30d",
    total_applications: 42,
    active_applications: 35,
    archived_applications: 7,
    status_counts: {
      APPLIED: 18,
      INTERVIEW_1: 3,
      OFFER: 1,
      REJECTED: 4,
    },
    follow_ups_due: 6,
    applied_count: 34,
    interview_count: 5,
    offer_count: 1,
    rejected_count: 6,
    response_rate: 0.2647,
    interview_rate: 0.1471,
    offer_rate: 0.0294,
    ...overrides,
  };
}

test("buildActivityFeedUrl serializes supported params only", () => {
  assert.equal(
    buildActivityFeedUrl("http://127.0.0.1:8001/api/v1", {
      kind: "STATUS_CHANGED",
      limit: 25,
    }),
    "http://127.0.0.1:8001/api/v1/activity/feed?limit=25&kind=STATUS_CHANGED",
  );
});

test("buildAnalyticsKpiUrl serializes range", () => {
  assert.equal(
    buildAnalyticsKpiUrl("http://127.0.0.1:8001/api/v1", "90d"),
    "http://127.0.0.1:8001/api/v1/analytics/kpi?range=90d",
  );
});

test("getActivityFeedViaRest calls GET /activity/feed with auth and maps items", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedAuthorization: string | null = null;

  globalThis.fetch = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requestedUrl = String(url);
    const headers = init?.headers as Record<string, string>;
    requestedAuthorization = headers.Authorization;

    return new Response(JSON.stringify(makeActivityFeedResponse()), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Request-ID": "req-feed-1" },
    });
  }) as typeof fetch;

  const result = await getActivityFeedViaRest({ limit: 50 });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/activity/feed?limit=50");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "event-1");
  assert.equal(result[0]?.applicationId, "app-1");
  assert.equal(result[0]?.type, "move");
  assert.equal(result[0]?.target, "Acme GmbH – Frontend Engineer");
});

test("mapActivityFeedResponseDto handles missing optional target without crashing", () => {
  const result = mapActivityFeedResponseDto(
    makeActivityFeedResponse({
      items: [
        {
          id: "event-2",
          user_id: "user-1",
          application_id: null,
          kind: "COMMENT_ADDED",
          title: "Comment added",
          description: "Manual note",
          payload: null,
          created_at: "not-a-date",
        },
      ],
    }),
  );

  assert.equal(result[0]?.applicationId, null);
  assert.equal(result[0]?.type, "note");
  assert.equal(result[0]?.timeMs, 0);
  assert.equal(result[0]?.target, "");
});

test("getAnalyticsKpiViaRest calls GET /analytics/kpi with auth and maps fields", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedAuthorization: string | null = null;

  globalThis.fetch = (async (url: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    requestedUrl = String(url);
    const headers = init?.headers as Record<string, string>;
    requestedAuthorization = headers.Authorization;

    return new Response(JSON.stringify(makeKpiResponse()), {
      status: 200,
      headers: { "Content-Type": "application/json", "X-Request-ID": "req-kpi-1" },
    });
  }) as typeof fetch;

  const result = await getAnalyticsKpiViaRest("30d");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/analytics/kpi?range=30d");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(result.totalApplications, 42);
  assert.equal(result.activeApplications, 35);
  assert.equal(result.statusCounts.APPLIED, 18);
  assert.equal(result.responseRate, 0.2647);
  assert.equal(result.offerRate, 0.0294);
});

test("mapKpiResponseDto safely defaults optional missing values", () => {
  const result = mapKpiResponseDto({
    ...makeKpiResponse(),
    status_counts: undefined as unknown as Record<string, number>,
    follow_ups_due: undefined as unknown as number,
  });

  assert.deepEqual(result.statusCounts, {});
  assert.equal(result.followUpsDue, 0);
});

async function run() {
  try {
    for (const { name, run } of tests) {
      await run();
      console.log(`✓ ${name}`);
    }
  } finally {
    globalThis.fetch = originalFetch;
    _resetRestAuthTokenProviderForTests();
    _resetBackendConfig();
  }
}

run();
