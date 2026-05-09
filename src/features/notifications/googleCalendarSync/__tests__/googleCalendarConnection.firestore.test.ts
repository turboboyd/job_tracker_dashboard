import assert from "node:assert/strict";

import {
  createFirestoreGoogleCalendarConnectionRepository,
  type AdminGoogleCalendarConnectionFirestoreLike,
} from "../googleCalendarConnection.firestore";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

const USER_ID = "user-1";
const NOW = new Date("2026-05-01T09:00:00Z");

test("createFirestoreGoogleCalendarConnectionRepository saves and reads tokens", async () => {
  const store = new Map<string, Record<string, unknown>>();
  const repository = createFirestoreGoogleCalendarConnectionRepository(
    createDb(store),
  );

  await repository.save({
    accessToken: "access-1",
    calendarId: "primary",
    connectedAt: NOW,
    expiresAt: new Date("2026-05-01T10:00:00Z"),
    refreshToken: "refresh-1",
    status: "connected",
    tokenType: "Bearer",
    updatedAt: NOW,
    userId: USER_ID,
  });

  assert.equal((await repository.get(USER_ID))?.refreshToken, "refresh-1");

  await repository.update(USER_ID, {
    accessToken: "access-2",
    expiresAt: new Date("2026-05-01T11:00:00Z"),
    updatedAt: new Date("2026-05-01T10:30:00Z"),
  });

  assert.equal((await repository.get(USER_ID))?.accessToken, "access-2");
});

test("createFirestoreGoogleCalendarConnectionRepository ignores invalid docs", async () => {
  const store = new Map<string, Record<string, unknown>>([
    [USER_ID, { status: "connected" }],
  ]);
  const repository = createFirestoreGoogleCalendarConnectionRepository(
    createDb(store),
  );

  assert.equal(await repository.get(USER_ID), null);
});

function createDb(
  store: Map<string, Record<string, unknown>>,
): AdminGoogleCalendarConnectionFirestoreLike {
  return {
    collection(collectionId) {
      assert.equal(collectionId, "googleCalendarConnections");

      return {
        doc(docId) {
          return createDocumentRef(store, docId);
        },
      };
    },
  };
}

function createDocumentRef(
  store: Map<string, Record<string, unknown>>,
  docId: string,
) {
  return {
    async get() {
      return {
        data: () => store.get(docId),
      };
    },
    async set(data: Record<string, unknown>) {
      store.set(docId, data);
    },
    async update(data: Record<string, unknown>) {
      store.set(docId, {
        ...(store.get(docId) ?? {}),
        ...data,
      });
    },
  };
}
