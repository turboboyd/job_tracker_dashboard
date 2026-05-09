import assert from "node:assert/strict";

import {
  processGoogleCalendarOutboxBatch,
  processGoogleCalendarOutboxItem,
  shouldProcessGoogleCalendarOutboxItem,
  type GoogleCalendarOutboxRepository,
} from "../googleCalendarOutbox.processor";
import type {
  GoogleCalendarOutboxItem,
  GoogleCalendarProvider,
} from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const now = new Date("2026-05-01T09:00:00Z");
const baseItem: GoogleCalendarOutboxItem = {
  id: "outbox-1",
  doc: {
    action: "create",
    channel: "google_calendar",
    createdAt: now,
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
    sendAfter: now,
    status: "pending",
    userId: "user-1",
  },
};

test("processGoogleCalendarOutboxItem updates an existing calendar event", async () => {
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      throw new Error("Should not create");
    },
    async deleteEvent() {
      throw new Error("Should not delete");
    },
    async updateEvent(eventId) {
      assert.equal(eventId, "event-1");
      return { htmlLink: "https://calendar/event-1", id: "event-1" };
    },
  };

  const result = await processGoogleCalendarOutboxItem(baseItem, {
    existingEvent: { id: "event-1" },
    now,
    provider,
  });

  assert.equal(result.patch.status, "synced");
  assert.equal(result.patch.eventId, "event-1");
  assert.equal(result.patch.htmlLink, "https://calendar/event-1");
});

test("processGoogleCalendarOutboxBatch resolves provider and applies result", async () => {
  const applied: string[] = [];
  const repository: GoogleCalendarOutboxRepository = {
    async applyResult(result) {
      applied.push(result.id);
    },
    async findLatestSyncedEvent() {
      return null;
    },
    async listDue() {
      return [baseItem];
    },
  };
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      return { id: "event-2" };
    },
    async deleteEvent() {
      throw new Error("Should not delete");
    },
    async updateEvent() {
      throw new Error("Should not update");
    },
  };

  const summary = await processGoogleCalendarOutboxBatch({
    now,
    providerResolver: {
      async resolve() {
        return provider;
      },
    },
    repository,
  });

  assert.equal(summary.processed, 1);
  assert.equal(summary.synced, 1);
  assert.deepEqual(applied, ["outbox-1"]);
});

test("processGoogleCalendarOutboxBatch fails cleanly without connected account", async () => {
  const results: string[] = [];
  const repository: GoogleCalendarOutboxRepository = {
    async applyResult(result) {
      if (result.patch.status === "failed") {
        results.push(result.patch.errorMessage);
      }
    },
    async findLatestSyncedEvent() {
      return null;
    },
    async listDue() {
      return [baseItem];
    },
  };

  const summary = await processGoogleCalendarOutboxBatch({
    now,
    providerResolver: {
      async resolve() {
        return null;
      },
    },
    repository,
  });

  assert.equal(summary.failed, 1);
  assert.deepEqual(results, ["Google Calendar account is not connected"]);
});

test("shouldProcessGoogleCalendarOutboxItem respects retry time", () => {
  assert.equal(shouldProcessGoogleCalendarOutboxItem(baseItem, now), true);
  assert.equal(
    shouldProcessGoogleCalendarOutboxItem(
      {
        ...baseItem,
        doc: {
          ...baseItem.doc,
          nextRetryAt: new Date("2026-05-01T09:30:00Z"),
          status: "failed",
        },
      },
      now,
    ),
    false,
  );
});
