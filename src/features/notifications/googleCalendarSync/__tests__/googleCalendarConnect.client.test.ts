import assert from "node:assert/strict";

import {
  buildGoogleCalendarConnectUrl,
  getGoogleCalendarClientId,
  getGoogleCalendarConnectEndpoint,
} from "../googleCalendarConnect.client";

function test(_name: string, run: () => void) {
  run();
}

const CONNECT_ENDPOINT = "/api/google-calendar/connect";

test("getGoogleCalendarConnectEndpoint reads public backend endpoint", () => {
  assert.equal(
    getGoogleCalendarConnectEndpoint(),
    CONNECT_ENDPOINT,
  );
});

test("getGoogleCalendarClientId reads browser OAuth client id", () => {
  assert.equal(getGoogleCalendarClientId(), "test-google-client-id");
});

test("buildGoogleCalendarConnectUrl keeps user, language and return target", () => {
  setWindowOrigin("https://app.example.com");

  const url = new URL(
    buildGoogleCalendarConnectUrl({
      endpoint: CONNECT_ENDPOINT,
      language: "ru",
      returnTo: "/settings/notifications?tab=calendar",
      userId: "user-1",
    }),
  );

  assert.equal(url.origin, "https://app.example.com");
  assert.equal(url.pathname, "/api/google-calendar/connect");
  assert.equal(url.searchParams.get("lng"), "ru");
  assert.equal(url.searchParams.get("returnTo"), "/settings/notifications?tab=calendar");
  assert.equal(url.searchParams.get("uid"), "user-1");
});

function setWindowOrigin(origin: string): void {
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      location: {
        origin,
      },
    },
  });
}
