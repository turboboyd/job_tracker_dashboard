import assert from "node:assert/strict";

import {
  createGoogleCalendarConnectionRuntime,
  type GoogleCalendarConnectionDoc,
  type GoogleCalendarConnectionPatch,
  type GoogleCalendarConnectionRepository,
} from "../googleCalendarConnection.runtime";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

const USER_ID = "user-1";
const CLIENT_ID = "client-id";
const CLIENT_SECRET = "client-secret";
const REDIRECT_URI = "https://app.example.com/oauth/google-calendar/callback";
const NOW = new Date("2026-05-01T09:00:00Z");
const PRIMARY_CALENDAR_ID = "primary";
const REFRESHED_ACCESS_TOKEN = "access-new";

test("connectWithCode stores a connected Google Calendar account", async () => {
  const repository = createMemoryRepository();
  const runtime = createGoogleCalendarConnectionRuntime({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    fetchImpl: createFetchMock([
      {
        access_token: "access-1",
        expires_in: 3600,
        refresh_token: "refresh-1",
        token_type: "Bearer",
      },
    ]),
    now: () => NOW,
    redirectUri: REDIRECT_URI,
    repository,
  });

  const connection = await runtime.connectWithCode({
    code: "code-1",
    userId: USER_ID,
  });

  assert.equal(connection.accessToken, "access-1");
  assert.equal(connection.refreshToken, "refresh-1");
  assert.equal(connection.status, "connected");
  assert.equal(connection.expiresAt.toISOString(), "2026-05-01T10:00:00.000Z");
  assert.equal((await repository.get(USER_ID))?.accessToken, "access-1");
});

test("resolve returns current token when it is still valid", async () => {
  const repository = createMemoryRepository(
    buildConnection({
      accessToken: "access-current",
      expiresAt: new Date("2026-05-01T10:00:00Z"),
    }),
  );
  const runtime = createGoogleCalendarConnectionRuntime({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    fetchImpl: createFetchMock([]),
    now: () => NOW,
    redirectUri: REDIRECT_URI,
    repository,
  });

  assert.deepEqual(await runtime.resolve(USER_ID), {
    accessToken: "access-current",
    calendarId: PRIMARY_CALENDAR_ID,
  });
});

test("resolve refreshes an expiring access token", async () => {
  const patches: GoogleCalendarConnectionPatch[] = [];
  const repository = createMemoryRepository(
    buildConnection({
      accessToken: "access-old",
      expiresAt: new Date("2026-05-01T09:02:00Z"),
    }),
    patches,
  );
  const runtime = createGoogleCalendarConnectionRuntime({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    fetchImpl: createFetchMock([
      {
        access_token: REFRESHED_ACCESS_TOKEN,
        expires_in: 1800,
        token_type: "Bearer",
      },
    ]),
    now: () => NOW,
    redirectUri: REDIRECT_URI,
    repository,
  });

  assert.deepEqual(await runtime.resolve(USER_ID), {
    accessToken: REFRESHED_ACCESS_TOKEN,
    calendarId: PRIMARY_CALENDAR_ID,
  });
  assert.equal(patches[0]?.accessToken, REFRESHED_ACCESS_TOKEN);
  assert.equal(patches[0]?.expiresAt?.toISOString(), "2026-05-01T09:30:00.000Z");
});

test("disconnect marks the connection revoked", async () => {
  const patches: GoogleCalendarConnectionPatch[] = [];
  const repository = createMemoryRepository(buildConnection(), patches);
  const runtime = createGoogleCalendarConnectionRuntime({
    clientId: CLIENT_ID,
    clientSecret: CLIENT_SECRET,
    fetchImpl: createFetchMock([]),
    now: () => NOW,
    redirectUri: REDIRECT_URI,
    repository,
  });

  await runtime.disconnect(USER_ID);

  assert.equal(patches[0]?.status, "revoked");
  assert.equal(patches[0]?.updatedAt.toISOString(), NOW.toISOString());
});

function buildConnection(
  patch: Partial<GoogleCalendarConnectionDoc> = {},
): GoogleCalendarConnectionDoc {
  return {
    accessToken: "access-1",
    calendarId: PRIMARY_CALENDAR_ID,
    connectedAt: NOW,
    expiresAt: new Date("2026-05-01T10:00:00Z"),
    refreshToken: "refresh-1",
    status: "connected",
    tokenType: "Bearer",
    updatedAt: NOW,
    userId: USER_ID,
    ...patch,
  };
}

function createMemoryRepository(
  initial: GoogleCalendarConnectionDoc | null = null,
  patches: GoogleCalendarConnectionPatch[] = [],
): GoogleCalendarConnectionRepository {
  let current = initial;

  return {
    async get() {
      return current;
    },
    async save(connection) {
      current = connection;
    },
    async update(_userId, patch) {
      patches.push(patch);
      current = current ? mergeConnectionPatch(current, patch) : current;
    },
  };
}

function mergeConnectionPatch(
  connection: GoogleCalendarConnectionDoc,
  patch: GoogleCalendarConnectionPatch,
): GoogleCalendarConnectionDoc {
  return {
    ...connection,
    ...Object.fromEntries(
      Object.entries(patch).filter(([, value]) => value !== undefined),
    ),
  } as GoogleCalendarConnectionDoc;
}

function createFetchMock(responses: Record<string, unknown>[]): typeof fetch {
  return (async () => {
    const response = responses.shift();
    if (!response) {
      throw new Error("Unexpected fetch call");
    }

    return new Response(JSON.stringify(response), { status: 200 });
  }) as typeof fetch;
}
