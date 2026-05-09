import assert from "node:assert/strict";

import { requestGoogleCalendarAccessToken } from "../googleCalendarToken.client";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

test("requestGoogleCalendarAccessToken resolves Google Identity Services token", async () => {
  const token = await requestGoogleCalendarAccessToken({
    clientId: "client-id",
    now: new Date("2026-05-01T09:00:00Z"),
    tokenClientFactory(config) {
      return {
        requestAccessToken() {
          config.callback({
            access_token: "access-1",
            expires_in: 3600,
            scope: "https://www.googleapis.com/auth/calendar.events",
            token_type: "Bearer",
          });
        },
      };
    },
  });

  assert.equal(token.accessToken, "access-1");
  assert.equal(token.expiresAt.toISOString(), "2026-05-01T10:00:00.000Z");
  assert.equal(token.tokenType, "Bearer");
});

test("requestGoogleCalendarAccessToken rejects denied access", async () => {
  await assert.rejects(
    () =>
      requestGoogleCalendarAccessToken({
        clientId: "client-id",
        tokenClientFactory(config) {
          return {
            requestAccessToken() {
              config.callback({
                error: "access_denied",
              });
            },
          };
        },
      }),
    /access_denied/,
  );
});
