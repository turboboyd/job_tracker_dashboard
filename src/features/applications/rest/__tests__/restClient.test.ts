import assert from "node:assert/strict";

import { buildAuthedRequest } from "src/shared/api";

function test(_name: string, run: () => void) {
  run();
}

test("buildAuthedRequest includes Authorization Bearer header", () => {
  const init = buildAuthedRequest("GET", "tok-abc");
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["Authorization"], "Bearer tok-abc");
});

test("buildAuthedRequest does not include Content-Type when no body", () => {
  const init = buildAuthedRequest("GET", "tok-abc");
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["Content-Type"], undefined);
});

test("buildAuthedRequest includes Content-Type application/json when body present", () => {
  const init = buildAuthedRequest("POST", "tok-abc", { foo: "bar" });
  const headers = init.headers as Record<string, string>;
  assert.equal(headers["Content-Type"], "application/json");
});

test("buildAuthedRequest serializes body as JSON", () => {
  const init = buildAuthedRequest("POST", "tok-abc", { status: "APPLIED" });
  assert.equal(init.body, JSON.stringify({ status: "APPLIED" }));
});

test("buildAuthedRequest sets correct HTTP method", () => {
  assert.equal(buildAuthedRequest("PATCH", "tok").method, "PATCH");
  assert.equal(buildAuthedRequest("DELETE", "tok").method, "DELETE");
});

test("buildAuthedRequest omits body field when no body provided", () => {
  const init = buildAuthedRequest("GET", "tok");
  assert.equal("body" in init, false);
});
