import assert from "node:assert/strict";

import { getAuthRedirectFrom } from "../authRedirect";

function test(_name: string, run: () => void) {
  run();
}

test("falls back to dashboard when redirect state is missing", () => {
  assert.equal(getAuthRedirectFrom(null), "/dashboard");
  assert.equal(getAuthRedirectFrom(undefined), "/dashboard");
});

test("uses redirect pathname and search from router state", () => {
  assert.equal(
    getAuthRedirectFrom({
      from: {
        pathname: "/applications",
        search: "?page=2&status=interview",
      },
    }),
    "/applications?page=2&status=interview",
  );
});

test("uses fallback pathname when state has no pathname", () => {
  assert.equal(
    getAuthRedirectFrom({ from: { search: "?next=1" } }, "/matches"),
    "/matches?next=1",
  );
});

test("supports custom fallback target", () => {
  assert.equal(getAuthRedirectFrom(null, "/board"), "/board");
});
