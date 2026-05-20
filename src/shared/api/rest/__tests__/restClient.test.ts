/* global RequestInit, ResponseInit */

import assert from "node:assert/strict";

import { ApiError, buildAuthedRequest, handleBlobResponse, handleResponse } from "../restClient";

type TestCase = {
  name: string;
  run: () => void | Promise<void>;
};

const tests: TestCase[] = [];

function test(name: string, run: () => void | Promise<void>) {
  tests.push({ name, run });
}

function headersOf(init: RequestInit): Record<string, string> {
  return init.headers as Record<string, string>;
}

function jsonResponse(
  body: unknown,
  init: ResponseInit & { requestId?: string } = {},
): Response {
  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  if (init.requestId) headers.set("X-Request-ID", init.requestId);

  return new Response(JSON.stringify(body), {
    status: init.status ?? 200,
    headers,
  });
}

test("buildAuthedRequest attaches Authorization header", () => {
  const init = buildAuthedRequest("GET", "token-123");

  assert.equal(headersOf(init).Authorization, "Bearer token-123");
});

test("buildAuthedRequest serializes JSON body and sets JSON headers", () => {
  const init = buildAuthedRequest("POST", "token-123", { title: "Frontend" });

  assert.equal(headersOf(init).Accept, "application/json");
  assert.equal(headersOf(init)["Content-Type"], "application/json");
  assert.equal(init.body, JSON.stringify({ title: "Frontend" }));
});

test("buildAuthedRequest keeps FormData Content-Type unset", () => {
  const form = new FormData();
  form.set("kind", "cv");

  const init = buildAuthedRequest("POST", "token-123", form);

  assert.equal(headersOf(init).Authorization, "Bearer token-123");
  assert.equal(headersOf(init).Accept, "application/json");
  assert.equal(headersOf(init)["Content-Type"], undefined);
  assert.equal(init.body, form);
});

test("buildAuthedRequest removes custom Content-Type for FormData", () => {
  const form = new FormData();
  form.set("kind", "cv");

  const init = buildAuthedRequest("POST", "token-123", form, {
    headers: { "Content-Type": "application/json" },
  });

  assert.equal(headersOf(init)["Content-Type"], undefined);
  assert.equal(init.body, form);
});

test("handleResponse parses backend error envelope", async () => {
  const response = jsonResponse(
    {
      error: {
        code: "APPLICATION_NOT_FOUND",
        message: "Application not found",
        request_id: "req-body-1",
      },
    },
    { status: 404, requestId: "req-header-1" },
  );

  await assert.rejects(
    () => handleResponse(response),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 404);
      assert.equal(error.code, "APPLICATION_NOT_FOUND");
      assert.equal(error.message, "Application not found");
      assert.equal(error.requestId, "req-body-1");
      assert.deepEqual(error.errorBody, {
        error: {
          code: "APPLICATION_NOT_FOUND",
          message: "Application not found",
          request_id: "req-body-1",
        },
      });
      return true;
    },
  );
});

test("handleResponse captures X-Request-ID when envelope request_id is missing", async () => {
  const response = jsonResponse(
    { error: { code: "SERVER_ERROR", message: "Server error" } },
    { status: 500, requestId: "req-header-2" },
  );

  await assert.rejects(
    () => handleResponse(response),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.requestId, "req-header-2");
      return true;
    },
  );
});

test("handleResponse does not crash on unknown error shape", async () => {
  const response = jsonResponse(
    { unexpected: true },
    { status: 502, requestId: "req-header-3" },
  );

  await assert.rejects(
    () => handleResponse(response),
    (error: unknown) => {
      assert.ok(error instanceof ApiError);
      assert.equal(error.status, 502);
      assert.equal(error.code, "502");
      assert.equal(error.message, "HTTP 502");
      assert.equal(error.requestId, "req-header-3");
      return true;
    },
  );
});

test("handleResponse does not crash on 204 empty response", async () => {
  const response = new Response(null, { status: 204 });

  await assert.doesNotReject(async () => {
    const result = await handleResponse(response);
    assert.equal(result, undefined);
  });
});


test("handleBlobResponse returns Blob metadata and request id", async () => {
  const response = new Response("file-content", {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": 'attachment; filename="resume.pdf"',
      "X-Request-ID": "req-download-1",
    },
  });

  const result = await handleBlobResponse(response);

  assert.equal(result.contentType, "application/pdf");
  assert.equal(result.contentDisposition, 'attachment; filename="resume.pdf"');
  assert.equal(result.requestId, "req-download-1");
  assert.equal(await result.blob.text(), "file-content");
});

test("handleResponse handles unknown non-JSON response gracefully", async () => {
  const response = new Response("ok", {
    status: 200,
    headers: { "Content-Type": "text/plain" },
  });

  const result = await handleResponse<string>(response);

  assert.equal(result, "ok");
});

void (async () => {
  for (const { name, run } of tests) {
    try {
      await run();
    } catch (error) {
      console.error(`Test failed: ${name}`);
      throw error;
    }
  }
})();
