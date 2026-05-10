import assert from "node:assert/strict";

import { processGoogleCalendarSyncTask } from "../googleCalendarSync.processor";
import type {
  GoogleCalendarEventPayload,
  GoogleCalendarPlanItem,
  GoogleCalendarProvider,
} from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  void run();
}

const item: GoogleCalendarPlanItem = {
  actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
  appId: "app-1",
  applicationUrl: "https://app.example.com/dashboard/applications/app-1",
  companyName: "NovaSoft",
  nextActionText: "Call back",
  roleTitle: "Frontend Developer",
};
const SHOULD_NOT_DELETE = "Should not delete";
const SHOULD_NOT_UPDATE = "Should not update";

test("processGoogleCalendarSyncTask creates missing events", async () => {
  const createdPayloads: GoogleCalendarEventPayload[] = [];
  const provider: GoogleCalendarProvider = {
    async createEvent(payload) {
      createdPayloads.push(payload);
      return { htmlLink: "https://calendar/event", id: "event-1" };
    },
    async deleteEvent() {
      throw new Error(SHOULD_NOT_DELETE);
    },
    async updateEvent() {
      throw new Error(SHOULD_NOT_UPDATE);
    },
  };

  const result = await processGoogleCalendarSyncTask({
    provider,
    task: { action: "create", item },
  });

  assert.equal(result.status, "synced");
  assert.equal(result.eventId, "event-1");
  assert.equal(createdPayloads[0]?.summary, "Frontend Developer / NovaSoft");
});

test("processGoogleCalendarSyncTask updates existing events", async () => {
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      throw new Error("Should not create");
    },
    async deleteEvent() {
      throw new Error(SHOULD_NOT_DELETE);
    },
    async updateEvent(eventId) {
      assert.equal(eventId, "event-1");
      return { id: "event-1" };
    },
  };

  const result = await processGoogleCalendarSyncTask({
    provider,
    task: { action: "update", eventId: "event-1", item },
  });

  assert.equal(result.status, "synced");
  assert.equal(result.eventId, "event-1");
});

test("processGoogleCalendarSyncTask deletes existing events", async () => {
  let deletedEventId = "";
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      throw new Error("Should not create");
    },
    async deleteEvent(eventId) {
      deletedEventId = eventId;
    },
    async updateEvent() {
      throw new Error(SHOULD_NOT_UPDATE);
    },
  };

  const result = await processGoogleCalendarSyncTask({
    provider,
    task: { action: "delete", eventId: "event-1", item },
  });

  assert.equal(result.status, "deleted");
  assert.equal(deletedEventId, "event-1");
});

test("processGoogleCalendarSyncTask returns failed result on provider error", async () => {
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      throw new Error("OAuth token expired");
    },
    async deleteEvent() {
      throw new Error(SHOULD_NOT_DELETE);
    },
    async updateEvent() {
      throw new Error(SHOULD_NOT_UPDATE);
    },
  };

  const result = await processGoogleCalendarSyncTask({
    provider,
    task: { action: "create", item },
  });

  assert.equal(result.status, "failed");
  assert.equal(result.errorMessage, "OAuth token expired");
});
