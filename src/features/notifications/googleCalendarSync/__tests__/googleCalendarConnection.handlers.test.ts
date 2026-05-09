import assert from "node:assert/strict";

import {
  completeGoogleCalendarConnection,
  startGoogleCalendarConnection,
  type GoogleCalendarOAuthStateDoc,
  type GoogleCalendarOAuthStateRepository,
} from "../googleCalendarConnection.handlers";
import type { GoogleCalendarConnectionDoc } from "../googleCalendarConnection.runtime";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

const NOW = new Date("2026-05-01T09:00:00Z");
const USER_ID = "user-1";
const RETURN_TO = "/settings/notifications";

test("startGoogleCalendarConnection stores state and returns authorization url", async () => {
  const savedStates: GoogleCalendarOAuthStateDoc[] = [];
  const repository = createStateRepository(savedStates);
  const result = await startGoogleCalendarConnection({
    loginHint: "user@example.com",
    now: NOW,
    returnTo: RETURN_TO,
    runtime: {
      buildAuthorizationUrl({ loginHint, state }) {
        return `https://accounts.example.test/auth?state=${state}&login_hint=${loginHint}`;
      },
    },
    state: "state-1",
    stateRepository: repository,
    userId: USER_ID,
  });

  assert.equal(result.state, "state-1");
  assert.equal(result.authorizationUrl, "https://accounts.example.test/auth?state=state-1&login_hint=user@example.com");
  assert.equal(savedStates[0]?.userId, USER_ID);
  assert.equal(savedStates[0]?.expiresAt.toISOString(), "2026-05-01T09:10:00.000Z");
});

test("completeGoogleCalendarConnection validates state and connects account", async () => {
  const repository = createStateRepository([
    {
      createdAt: NOW,
      expiresAt: new Date("2026-05-01T09:10:00Z"),
      returnTo: RETURN_TO,
      state: "state-1",
      userId: USER_ID,
    },
  ]);
  const result = await completeGoogleCalendarConnection({
    code: "code-1",
    now: NOW,
    runtime: {
      async connectWithCode({ code, userId }) {
        assert.equal(code, "code-1");
        assert.equal(userId, USER_ID);

        return buildConnection();
      },
    },
    state: "state-1",
    stateRepository: repository,
  });

  assert.equal(result.connection.accessToken, "access-1");
  assert.equal(result.returnTo, RETURN_TO);
  assert.equal(result.userId, USER_ID);
});

test("completeGoogleCalendarConnection rejects expired state", async () => {
  const repository = createStateRepository([
    {
      createdAt: NOW,
      expiresAt: new Date("2026-05-01T09:00:00Z"),
      returnTo: RETURN_TO,
      state: "state-1",
      userId: USER_ID,
    },
  ]);

  await assert.rejects(
    () =>
      completeGoogleCalendarConnection({
        code: "code-1",
        now: new Date("2026-05-01T09:01:00Z"),
        runtime: {
          async connectWithCode() {
            return buildConnection();
          },
        },
        state: "state-1",
        stateRepository: repository,
      }),
    /Google Calendar OAuth state has expired/,
  );
});

test("completeGoogleCalendarConnection surfaces provider denial", async () => {
  await assert.rejects(
    () =>
      completeGoogleCalendarConnection({
        error: "access_denied",
        runtime: {
          async connectWithCode() {
            return buildConnection();
          },
        },
        stateRepository: createStateRepository([]),
      }),
    /Google Calendar authorization failed: access_denied/,
  );
});

function createStateRepository(
  states: GoogleCalendarOAuthStateDoc[],
): GoogleCalendarOAuthStateRepository {
  return {
    async consume(state) {
      const index = states.findIndex((item) => item.state === state);
      if (index < 0) return null;

      const [item] = states.splice(index, 1);
      return item ?? null;
    },
    async save(state) {
      states.push(state);
    },
  };
}

function buildConnection(): GoogleCalendarConnectionDoc {
  return {
    accessToken: "access-1",
    calendarId: "primary",
    connectedAt: NOW,
    expiresAt: new Date("2026-05-01T10:00:00Z"),
    refreshToken: "refresh-1",
    status: "connected",
    tokenType: "Bearer",
    updatedAt: NOW,
    userId: USER_ID,
  };
}
