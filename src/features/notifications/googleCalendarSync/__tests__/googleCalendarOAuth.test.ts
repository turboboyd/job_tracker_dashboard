import assert from "node:assert/strict";

import {
  buildGoogleCalendarAuthorizationUrl,
  exchangeGoogleOAuthCode,
  GOOGLE_CALENDAR_EVENTS_SCOPE,
  refreshGoogleOAuthAccessToken,
} from "../googleCalendarOAuth";

const CLIENT_ID = "client-id";
const CLIENT_SECRET = "client-secret";
const TOKEN_ENDPOINT = "https://oauth.example.test/token";
const NOW = new Date("2026-05-01T09:00:00Z");

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

test("buildGoogleCalendarAuthorizationUrl requests offline calendar access", () => {
  const url = new URL(
    buildGoogleCalendarAuthorizationUrl({
      clientId: CLIENT_ID,
      loginHint: "user@example.com",
      redirectUri: "https://app.example.com/oauth/google-calendar/callback",
      state: "state-1",
    }),
  );

  assert.equal(url.searchParams.get("access_type"), "offline");
  assert.equal(url.searchParams.get("client_id"), CLIENT_ID);
  assert.equal(url.searchParams.get("include_granted_scopes"), "true");
  assert.equal(url.searchParams.get("login_hint"), "user@example.com");
  assert.equal(url.searchParams.get("prompt"), "consent");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("scope"), GOOGLE_CALENDAR_EVENTS_SCOPE);
  assert.equal(url.searchParams.get("state"), "state-1");
});

test("exchangeGoogleOAuthCode posts authorization code grant", async () => {
  const calls: RequestRecord[] = [];
  const fetchImpl = createFetchMock(calls, {
    access_token: "access-1",
    expires_in: 3600,
    refresh_token: "refresh-1",
    scope: GOOGLE_CALENDAR_EVENTS_SCOPE,
    token_type: "Bearer",
  });

  const tokens = await exchangeGoogleOAuthCode({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    code: "code-1",
    endpoint: TOKEN_ENDPOINT,
    fetchImpl,
    now: NOW,
    redirectUri: "https://app.example.com/callback",
  });
  const body = new URLSearchParams(calls[0]?.init.body as string);

  assert.equal(body.get("grant_type"), "authorization_code");
  assert.equal(body.get("code"), "code-1");
  assert.equal(tokens.accessToken, "access-1");
  assert.equal(tokens.refreshToken, "refresh-1");
  assert.equal(tokens.expiresAt.toISOString(), "2026-05-01T10:00:00.000Z");
});

test("refreshGoogleOAuthAccessToken posts refresh token grant", async () => {
  const calls: RequestRecord[] = [];
  const fetchImpl = createFetchMock(calls, {
    access_token: "access-2",
    expires_in: 1800,
    token_type: "Bearer",
  });

  const tokens = await refreshGoogleOAuthAccessToken({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    endpoint: TOKEN_ENDPOINT,
    fetchImpl,
    now: NOW,
    refreshToken: "refresh-1",
  });
  const body = new URLSearchParams(calls[0]?.init.body as string);

  assert.equal(body.get("grant_type"), "refresh_token");
  assert.equal(body.get("refresh_token"), "refresh-1");
  assert.equal(tokens.accessToken, "access-2");
  assert.equal(tokens.expiresAt.toISOString(), "2026-05-01T09:30:00.000Z");
});

test("refreshGoogleOAuthAccessToken exposes provider error details", async () => {
  const fetchImpl = createFetchMock([], {
    error: "invalid_grant",
    error_description: "Token has been expired or revoked",
  }, 400);

  await assert.rejects(
    () =>
      refreshGoogleOAuthAccessToken({
        clientId: CLIENT_ID,
        clientSecret: CLIENT_SECRET,
        fetchImpl,
        refreshToken: "refresh-1",
      }),
    /Google OAuth token request failed: 400 Token has been expired or revoked/,
  );
});

function createFetchMock(
  calls: RequestRecord[],
  body: Record<string, unknown>,
  status = 200,
): typeof fetch {
  return (async (input: RequestInfo | URL, init?: RequestInit) => {
    calls.push({
      init: init ?? {},
      url: getRequestUrl(input),
    });

    return new Response(JSON.stringify(body), { status });
  }) as typeof fetch;
}

function getRequestUrl(input: RequestInfo | URL): string {
  if (typeof input === "string") return input;
  if (input instanceof URL) return input.toString();

  return input.url;
}

interface RequestRecord {
  init: RequestInit;
  url: string;
}
