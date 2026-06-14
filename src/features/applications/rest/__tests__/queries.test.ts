import assert from "node:assert/strict";

import {
  _overrideRestAuthTokenProviderForTests,
  _resetRestAuthTokenProviderForTests,
} from "src/shared/api/rest/restClient";
import { _overrideBackendConfig, _resetBackendConfig } from "src/shared/config";

import type {
  ApplicationReadDto,
  DocumentReadDto,
  HistoryItemReadDto,
} from "../adapter";
import {
  buildApplicationCommentsUrl,
  buildApplicationDetailUrl,
  buildApplicationDocumentsUrl,
  buildApplicationHistoryUrl,
  buildApplicationStatusUrl,
  buildDocumentDetailUrl,
  buildDocumentDownloadUrl,
  buildApplicationsListUrl,
  buildCurrentUserUrl,
  buildVacancyImportPreviewUrl,
  changeApplicationStatusViaRest,
  createApplicationViaRest,
  createApplicationCommentViaRest,
  deleteApplicationViaRest,
  deleteDocumentViaRest,
  downloadDocumentViaRest,
  getApplicationByIdViaRest,
  getApplicationHistoryPageViaRest,
  getApplicationHistoryViaRest,
  getCurrentUserViaRest,
  getDocumentViaRest,
  listApplicationDocumentsViaRest,
  listApplicationsViaRest,
  previewVacancyImportViaRest,
  updateApplicationViaRest,
  uploadApplicationDocumentViaRest,
  validateApplicationDocumentUploadFile,
} from "../queries";

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

const tests: Array<{ name: string; run: () => void | Promise<void> }> = [];
const originalFetch = globalThis.fetch;

function makeDto(
  overrides: Partial<ApplicationReadDto> = {},
): ApplicationReadDto {
  const { loop_id: loopIdOverride, is_favorite: isFavoriteOverride, ...restOverrides } = overrides;

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
    has_loop: false,
    cv_version_id: null,
    profile_version_id: null,
    days_in_pipeline: 10,
    days_since_applied: 8,
    days_in_current_status: 3,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-02T00:00:00.000Z",
    ...restOverrides,
    loop_id: loopIdOverride ?? "loop-1",
    is_favorite: isFavoriteOverride ?? false,
  };
}

function makeHistoryDto(
  overrides: Partial<HistoryItemReadDto> = {},
): HistoryItemReadDto {
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
    comment: "Looks promising",
    feedback_type: null,
    sentiment: null,
    rejection_reason_code: null,
    correlation_id: null,
    created_at: "2026-01-03T10:00:00.000Z",
    ...overrides,
  };
}

function makeDocumentDto(
  overrides: Partial<DocumentReadDto> = {},
): DocumentReadDto {
  return {
    id: "doc-1",
    application_id: "app-1",
    kind: "cv",
    original_filename: "resume.pdf",
    content_type: "application/pdf",
    size_bytes: 153472,
    sha256_hash: "sha-1",
    status: "active",
    created_at: "2026-01-04T10:00:00.000Z",
    updated_at: "2026-01-04T11:00:00.000Z",
    ...overrides,
  };
}

function installAuthUser(): void {
  _overrideRestAuthTokenProviderForTests(async () => "firebase-token-1");
}

test("getCurrentUserViaRest calls GET /users/me for explicit REST user bootstrap", async () => {
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
        email: "user@example.com",
        display_name: "User",
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

  const result = await getCurrentUserViaRest();

  assert.equal(
    buildCurrentUserUrl("http://127.0.0.1:8001/api/v1"),
    "http://127.0.0.1:8001/api/v1/users/me",
  );
  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/users/me");
  assert.equal(requestedMethod, "GET");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(result.id, "local-user-1");
});


test("buildVacancyImportPreviewUrl points to the preview endpoint", () => {
  assert.equal(
    buildVacancyImportPreviewUrl("http://127.0.0.1:8001/api/v1"),
    "http://127.0.0.1:8001/api/v1/vacancy-import/preview",
  );
});

test("previewVacancyImportViaRest posts URL and maps backend preview shape", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedBody = "";
  let requestedAuthorization: string | undefined;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedBody = String(init?.body ?? "");
    requestedAuthorization = (init?.headers as Record<string, string>).Authorization;

    return new Response(
      JSON.stringify({
        source_url: "https://example.com/job",
        source: "example.com",
        company_name: "Acme GmbH",
        role_title: "Frontend Developer",
        location_text: "Berlin",
        vacancy_description: "Build UI.",
        confidence: { role_title: 0.9 },
        warnings: ["Check imported fields before creating."],
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await previewVacancyImportViaRest("https://example.com/job");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/vacancy-import/preview");
  assert.equal(requestedMethod, "POST");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.deepEqual(JSON.parse(requestedBody), { url: "https://example.com/job" });
  assert.equal(result.sourceUrl, "https://example.com/job");
  assert.equal(result.source, "example.com");
  assert.equal(result.companyName, "Acme GmbH");
  assert.equal(result.roleTitle, "Frontend Developer");
  assert.equal(result.locationText, "Berlin");
  assert.equal(result.vacancyDescription, "Build UI.");
  assert.deepEqual(result.confidence, { role_title: 0.9 });
  assert.deepEqual(result.warnings, ["Check imported fields before creating."]);
});

test("buildApplicationsListUrl omits undefined values and serializes supported query params", () => {
  const url = buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", {
    archived: false,
    status: ["APPLIED", "INTERVIEW_1"],
    stage: "ACTIVE",
    search: "acme frontend",
    limit: 50,
    offset: 25,
    sort: "last_status_change_at_desc",
  });

  assert.equal(
    url,
    "http://127.0.0.1:8001/api/v1/applications?archived=false&status=APPLIED%2CINTERVIEW_1&stage=ACTIVE&search=acme+frontend&limit=50&offset=25&sort=last_status_change_at_desc",
  );
});


test("buildApplicationsListUrl clamps limit to backend max 100", () => {
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", { limit: 500 }),
    "http://127.0.0.1:8001/api/v1/applications?limit=100",
  );
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", { limit: 100 }),
    "http://127.0.0.1:8001/api/v1/applications?limit=100",
  );
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", { limit: 50 }),
    "http://127.0.0.1:8001/api/v1/applications?limit=50",
  );
});

test("buildApplicationsListUrl supports loop_id filter", () => {
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", { loopId: "loop-1" }),
    "http://127.0.0.1:8001/api/v1/applications?loop_id=loop-1",
  );
});


test("buildApplicationsListUrl supports is_favorite filter", () => {
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", { isFavorite: true }),
    "http://127.0.0.1:8001/api/v1/applications?is_favorite=true",
  );
});

test("buildApplicationsListUrl supports archived=true with pagination offset", () => {
  assert.equal(
    buildApplicationsListUrl("http://127.0.0.1:8001/api/v1", {
      archived: true,
      limit: 20,
      offset: 40,
    }),
    "http://127.0.0.1:8001/api/v1/applications?archived=true&limit=20&offset=40",
  );
});

test("listApplicationsViaRest calls GET /applications and unwraps ApplicationListResponse envelope", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedAuthorization: string | null = null;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    const headers = init?.headers as Record<string, string>;
    requestedAuthorization = headers.Authorization;

    return new Response(
      JSON.stringify({
        items: [makeDto()],
        total: 1,
        limit: 50,
        offset: 0,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": "req-list-1",
        },
      },
    );
  }) as typeof fetch;

  const result = await listApplicationsViaRest("user-1", {
    archived: false,
    status: "APPLIED",
    limit: 50,
    offset: 0,
    sort: "updated_at_desc",
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications?archived=false&status=APPLIED&limit=50&offset=0&sort=updated_at_desc",
  );
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(result.total, 1);
  assert.equal(result.limit, 50);
  assert.equal(result.offset, 0);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.id, "app-1");
  assert.equal(result.items[0]?.data.job.companyName, "Acme GmbH");
  assert.equal(result.items[0]?.data.daysInPipeline, 10);
});

test("buildApplicationDetailUrl encodes application id", () => {
  assert.equal(
    buildApplicationDetailUrl("http://127.0.0.1:8001/api/v1", "app 1/2"),
    "http://127.0.0.1:8001/api/v1/applications/app%201%2F2",
  );
  assert.equal(
    buildApplicationStatusUrl("http://127.0.0.1:8001/api/v1", "app-1"),
    "http://127.0.0.1:8001/api/v1/applications/app-1/status",
  );
});

test("createApplicationViaRest posts backend create body and maps ApplicationRead response", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedContentType: string | undefined;
  let requestedAuthorization: string | undefined;
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    const headers = init?.headers as Record<string, string>;
    requestedContentType = headers["Content-Type"];
    requestedAuthorization = headers.Authorization;
    requestedBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify(
        makeDto({
          id: "created-app-1",
          company_name: "NewCo",
          role_title: "Full Stack Developer",
          vacancy_url: "https://example.com/job",
          source: "LinkedIn",
          status: "SAVED",
          current_note: "Promising",
          tags: ["react", "fastapi"],
          vacancy_description: "Build product features",
        }),
      ),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await createApplicationViaRest("user-1", {
    companyName: "NewCo",
    roleTitle: "Full Stack Developer",
    loopId: "loop-1",
    vacancyUrl: "https://example.com/job",
    source: "LinkedIn",
    status: "SAVED",
    currentNote: "Promising",
    tags: ["react", "fastapi"],
    rawDescription: "Build product features",
  });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications");
  assert.equal(requestedMethod, "POST");
  assert.equal(requestedContentType, "application/json");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.deepEqual(requestedBody, {
    company_name: "NewCo",
    role_title: "Full Stack Developer",
    loop_id: "loop-1",
    vacancy_url: "https://example.com/job",
    source: "LinkedIn",
    status: "SAVED",
    tags: ["react", "fastapi"],
    current_note: "Promising",
    vacancy_description: "Build product features",
  });
  assert.equal(result.id, "created-app-1");
  assert.equal(result.data.job.companyName, "NewCo");
  assert.equal(result.data.job.roleTitle, "Full Stack Developer");
  assert.equal(result.data.loopLinkage?.loopId, "loop-1");
  assert.equal(result.data.notes?.currentNote, "Promising");
  assert.deepEqual(result.data.notes?.tags, ["react", "fastapi"]);
});

test("getApplicationByIdViaRest calls GET /applications/{id} and maps ApplicationRead", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";

    return new Response(JSON.stringify(makeDto({ days_in_pipeline: 7 })), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;

  const result = await getApplicationByIdViaRest("fallback-user", "app-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "GET");
  assert.equal(result.id, "app-1");
  assert.equal(result.data.job.companyName, "Acme GmbH");
  assert.equal(result.data.daysInPipeline, 7);
});

test("updateApplicationViaRest calls PATCH /applications/{id}, sends JSON patch, and maps response", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedContentType: string | undefined;
  let requestedBody: unknown;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedContentType = (init?.headers as Record<string, string>)[
      "Content-Type"
    ];
    requestedBody = JSON.parse(String(init?.body));

    return new Response(
      JSON.stringify(
        makeDto({ role_title: "Lead Engineer", days_in_current_status: 4 }),
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await updateApplicationViaRest("user-1", "app-1", {
    "job.roleTitle": "Lead Engineer",
    "notes.currentNote": "Updated",
  });

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "PATCH");
  assert.equal(requestedContentType, "application/json");
  assert.deepEqual(requestedBody, {
    role_title: "Lead Engineer",
    current_note: "Updated",
  });
  assert.equal(result.data.job.roleTitle, "Lead Engineer");
  assert.equal(result.data.daysInCurrentStatus, 4);
});

test("changeApplicationStatusViaRest uses backend status payload shape", async () => {
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
        makeDto({
          status: "INTERVIEW_1",
          sub_status: "screen",
          days_since_applied: 2,
        }),
      ),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await changeApplicationStatusViaRest("user-1", "app-1", {
    toStatus: "INTERVIEW_1",
    subStatus: "screen",
    comment: "Moved forward",
    correlationId: "corr-1",
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/status",
  );
  assert.equal(requestedMethod, "POST");
  assert.deepEqual(requestedBody, {
    to_status: "INTERVIEW_1",
    sub_status: "screen",
    comment: "Moved forward",
    correlation_id: "corr-1",
  });
  assert.equal(result.data.process.status, "INTERVIEW_1");
  assert.equal(result.data.process.subStatus, "screen");
  assert.equal(result.data.daysSinceApplied, 2);
});

test("buildApplicationHistoryUrl and buildApplicationCommentsUrl encode app id", () => {
  assert.equal(
    buildApplicationHistoryUrl("http://127.0.0.1:8001/api/v1", "app 1/2", { limit: 25 }),
    "http://127.0.0.1:8001/api/v1/applications/app%201%2F2/history?limit=25",
  );
  assert.equal(
    buildApplicationCommentsUrl("http://127.0.0.1:8001/api/v1", "app 1/2"),
    "http://127.0.0.1:8001/api/v1/applications/app%201%2F2/comments",
  );
});

test("getApplicationHistoryPageViaRest sends limit offset type and preserves envelope", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";

  globalThis.fetch = (async (url: RequestInfo | URL) => {
    requestedUrl = String(url);

    return new Response(
      JSON.stringify({
        items: [makeHistoryDto({ type: "COMMENT", comment: "Paged note" })],
        total: 7,
        limit: 20,
        offset: 40,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await getApplicationHistoryPageViaRest("app-1", {
    limit: 20,
    offset: 40,
    type: "COMMENT",
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/history?limit=20&offset=40&type=COMMENT",
  );
  assert.equal(result.total, 7);
  assert.equal(result.limit, 20);
  assert.equal(result.offset, 40);
  assert.equal(result.items.length, 1);
  assert.equal(result.items[0]?.data.type, "COMMENT");
  assert.equal(result.items[0]?.data.comment, "Paged note");
});

test("getApplicationHistoryViaRest calls GET /applications/{id}/history and maps history envelope", async () => {
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
          makeHistoryDto({
            type: "STATUS_CHANGE",
            from_status: "SAVED",
            to_status: "APPLIED",
            comment: "Applied",
            correlation_id: "corr-1",
          }),
        ],
        total: 1,
        limit: 25,
        offset: 0,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await getApplicationHistoryViaRest("app-1", 25);

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/history?limit=25&offset=0",
  );
  assert.equal(requestedMethod, "GET");
  assert.equal(result.length, 1);
  assert.equal(result[0]?.id, "history-1");
  assert.equal(result[0]?.data.type, "STATUS_CHANGE");
  assert.equal(result[0]?.data.fromStatus, "SAVED");
  assert.equal(result[0]?.data.toStatus, "APPLIED");
  assert.equal(result[0]?.data.comment, "Applied");
  assert.equal(result[0]?.data.correlationId, "corr-1");
});

test("createApplicationCommentViaRest posts { text }, not { comment }, and maps created history item", async () => {
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
        makeHistoryDto({ comment: "New note", correlation_id: "corr-2" }),
      ),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await createApplicationCommentViaRest("app-1", {
    text: "New note",
    correlationId: "corr-2",
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/comments",
  );
  assert.equal(requestedMethod, "POST");
  assert.deepEqual(requestedBody, {
    text: "New note",
    correlation_id: "corr-2",
  });
  assert.equal(
    Object.prototype.hasOwnProperty.call(
      requestedBody as Record<string, unknown>,
      "comment",
    ),
    false,
  );
  assert.equal(result.id, "history-1");
  assert.equal(result.data.type, "COMMENT");
  assert.equal(result.data.comment, "New note");
  assert.equal(result.data.correlationId, "corr-2");
});

test("deleteApplicationViaRest calls DELETE /applications/{id} and handles 204 response", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    return new Response(null, {
      status: 204,
      headers: { "X-Request-ID": "req-delete-1" },
    });
  }) as typeof fetch;

  await deleteApplicationViaRest("app-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/applications/app-1");
  assert.equal(requestedMethod, "DELETE");
});

test("document URL builders encode ids", () => {
  assert.equal(
    buildApplicationDocumentsUrl("http://127.0.0.1:8001/api/v1", "app 1/2"),
    "http://127.0.0.1:8001/api/v1/applications/app%201%2F2/documents",
  );
  assert.equal(
    buildDocumentDetailUrl("http://127.0.0.1:8001/api/v1", "doc 1/2"),
    "http://127.0.0.1:8001/api/v1/documents/doc%201%2F2",
  );
  assert.equal(
    buildDocumentDownloadUrl("http://127.0.0.1:8001/api/v1", "doc 1/2"),
    "http://127.0.0.1:8001/api/v1/documents/doc%201%2F2/download",
  );
});

test("listApplicationDocumentsViaRest calls GET /applications/{id}/documents and maps metadata", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";

    return new Response(
      JSON.stringify({
        items: [makeDocumentDto()],
        total: 1,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;

  const result = await listApplicationDocumentsViaRest("app-1");

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/documents",
  );
  assert.equal(requestedMethod, "GET");
  assert.equal(result.total, 1);
  assert.equal(result.items[0]?.id, "doc-1");
  assert.equal(result.items[0]?.applicationId, "app-1");
  assert.equal(result.items[0]?.kind, "cv");
  assert.equal(result.items[0]?.originalFilename, "resume.pdf");
  assert.equal(result.items[0]?.contentType, "application/pdf");
  assert.equal(result.items[0]?.sizeBytes, 153472);
  assert.equal(result.items[0]?.status, "active");
  assert.equal(result.items[0]?.createdAt, "2026-01-04T10:00:00.000Z");
});

test("getDocumentViaRest calls GET /documents/{document_id} and maps metadata", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    return new Response(
      JSON.stringify(makeDocumentDto({ original_filename: "cover.docx" })),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  }) as typeof fetch;

  const result = await getDocumentViaRest("doc-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/documents/doc-1");
  assert.equal(requestedMethod, "GET");
  assert.equal(result.originalFilename, "cover.docx");
});

test("downloadDocumentViaRest uses authenticated GET and maps Blob download metadata", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";
  let requestedAuthorization: string | null = null;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    requestedAuthorization = (init?.headers as Record<string, string>)
      .Authorization;

    return new Response("file-content", {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="resume.pdf"',
        "X-Request-ID": "req-download-1",
      },
    });
  }) as typeof fetch;

  const result = await downloadDocumentViaRest("doc-1");

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/documents/doc-1/download",
  );
  assert.equal(requestedMethod, "GET");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(result.contentType, "application/pdf");
  assert.equal(result.contentDisposition, 'attachment; filename="resume.pdf"');
  assert.equal(result.filename, "resume.pdf");
  assert.equal(result.requestId, "req-download-1");
  assert.equal(await result.blob.text(), "file-content");
});

test("deleteDocumentViaRest calls DELETE /documents/{document_id} and handles 204 response", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  let requestedUrl = "";
  let requestedMethod = "";

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    return new Response(null, {
      status: 204,
      headers: { "X-Request-ID": "req-doc-delete-1" },
    });
  }) as typeof fetch;

  await deleteDocumentViaRest("doc-1");

  assert.equal(requestedUrl, "http://127.0.0.1:8001/api/v1/documents/doc-1");
  assert.equal(requestedMethod, "DELETE");
});

test("uploadApplicationDocumentViaRest posts multipart FormData with file and kind", async () => {
  installAuthUser();
  _overrideBackendConfig({ apiBaseUrl: "http://127.0.0.1:8001/api/v1" });

  const file = new File(["resume"], "resume.pdf", { type: "application/pdf" });
  let requestedUrl = "";
  let requestedMethod = "";
  let requestedAuthorization: string | undefined;
  let requestedContentType: string | undefined;
  let requestedBody: BodyInit | null | undefined;

  globalThis.fetch = (async (url: RequestInfo | URL, init?: RequestInit) => {
    requestedUrl = String(url);
    requestedMethod = init?.method ?? "";
    const headers = init?.headers as Record<string, string>;
    requestedAuthorization = headers.Authorization;
    requestedContentType = headers["Content-Type"];
    requestedBody = init?.body;

    return new Response(
      JSON.stringify(makeDocumentDto({ original_filename: "resume.pdf" })),
      {
        status: 201,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": "req-upload-1",
        },
      },
    );
  }) as typeof fetch;

  const result = await uploadApplicationDocumentViaRest("app-1", {
    file,
    kind: "cv",
  });

  assert.equal(
    requestedUrl,
    "http://127.0.0.1:8001/api/v1/applications/app-1/documents",
  );
  assert.equal(requestedMethod, "POST");
  assert.equal(requestedAuthorization, "Bearer firebase-token-1");
  assert.equal(requestedContentType, undefined);
  assert.ok(requestedBody instanceof FormData);
  assert.equal((requestedBody as FormData).get("file"), file);
  assert.equal((requestedBody as FormData).get("kind"), "cv");
  assert.equal(result.originalFilename, "resume.pdf");
  assert.equal(result.kind, "cv");
});

test("validateApplicationDocumentUploadFile accepts PDF DOCX TXT ZIP and rejects oversized files", () => {
  assert.equal(
    validateApplicationDocumentUploadFile(
      new File(["pdf"], "resume.pdf", { type: "application/pdf" }),
    ).ok,
    true,
  );
  assert.equal(
    validateApplicationDocumentUploadFile(
      new File(["docx"], "cover.docx", {
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      }),
    ).ok,
    true,
  );
  assert.equal(
    validateApplicationDocumentUploadFile(
      new File(["txt"], "notes.txt", { type: "text/plain" }),
    ).ok,
    true,
  );
  assert.equal(
    validateApplicationDocumentUploadFile(
      new File(["zip"], "task.zip", { type: "application/zip" }),
    ).ok,
    true,
  );

  const oversized = {
    name: "big.pdf",
    size: 10 * 1024 * 1024 + 1,
    type: "application/pdf",
  };

  const result = validateApplicationDocumentUploadFile(oversized);

  assert.equal(result.ok, false);
  assert.equal(
    result.message,
    "Файл слишком большой. Максимальный размер — 10 MB.",
  );
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
