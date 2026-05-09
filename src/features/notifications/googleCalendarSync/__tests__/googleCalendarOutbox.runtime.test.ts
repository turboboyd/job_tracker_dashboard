import assert from "node:assert/strict";

import {
  createFirestoreGoogleCalendarOutboxRepository,
  createGoogleCalendarCredentialsProviderResolver,
  type AdminFirestoreLike,
} from "../googleCalendarOutbox.runtime";
import type { GoogleCalendarOutboxWorkerResult } from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const SYNCED_AT_ISO = "2026-05-01T10:00:00Z";

test("createFirestoreGoogleCalendarOutboxRepository lists due calendar docs", async () => {
  const updates: Record<string, unknown>[] = [];
  const docData = {
    action: "create",
    channel: "google_calendar",
    createdAt: new Date("2026-05-01T09:00:00Z"),
    dedupeKey: "google_calendar:app-1",
    kind: "application_plan",
    payload: {
      actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
      appId: "app-1",
      applicationUrl: "https://app.example.com/dashboard/applications/app-1",
      companyName: "NovaSoft",
      nextActionText: "Call back",
      roleTitle: "Frontend Developer",
    },
    sendAfter: new Date("2026-05-01T09:00:00Z"),
    status: "pending",
    userId: "user-1",
  };
  const db = createDb([
    {
      data: () => docData,
      id: "outbox-1",
      ref: {
        async update(data: Record<string, unknown>) {
          updates.push(data);
        },
      },
    },
  ]);
  const repository = createFirestoreGoogleCalendarOutboxRepository(db);
  const items = await repository.listDue({
    limit: 10,
    now: new Date(SYNCED_AT_ISO),
  });

  assert.equal(items.length, 1);
  assert.equal(items[0]?.doc.payload.appId, "app-1");

  const result: GoogleCalendarOutboxWorkerResult = {
    id: "outbox-1",
    patch: {
      attemptCount: 1,
      eventId: "event-1",
      lastAttemptAt: new Date(SYNCED_AT_ISO),
      status: "synced",
      syncedAt: new Date(SYNCED_AT_ISO),
    },
  };

  await repository.applyResult(result);
  assert.equal(updates[0]?.eventId, "event-1");
});

test("createFirestoreGoogleCalendarOutboxRepository finds latest synced event", async () => {
  const db = createDb([
    {
      data: () => ({
        eventId: "event-1",
        htmlLink: "https://calendar/event-1",
      }),
      id: "outbox-1",
      ref: {
        update: () => Promise.resolve(),
      },
    },
  ]);
  const repository = createFirestoreGoogleCalendarOutboxRepository(db);
  const event = await repository.findLatestSyncedEvent("user-1", "app-1");

  assert.deepEqual(event, {
    htmlLink: "https://calendar/event-1",
    id: "event-1",
  });
});

test("createGoogleCalendarCredentialsProviderResolver skips missing OAuth token", async () => {
  const resolver = createGoogleCalendarCredentialsProviderResolver({
    async resolve() {
      return null;
    },
  });

  assert.equal(await resolver.resolve("user-1"), null);
});

function createDb(docs: MockDocumentSnapshot[]): AdminFirestoreLike {
  return {
    collectionGroup() {
      return createQuery(docs);
    },
  };
}

function createQuery(docs: MockDocumentSnapshot[]) {
  return {
    async get() {
      return { docs };
    },
    limit(_value: number) {
      return this;
    },
    orderBy(_field: string, _direction?: "asc" | "desc") {
      return this;
    },
    where(_field: string, _operator: string, _value: unknown) {
      return this;
    },
  };
}

interface MockDocumentSnapshot {
  data: () => Record<string, unknown> | undefined;
  id: string;
  ref: {
    update: (data: Record<string, unknown>) => Promise<void>;
  };
}
