import assert from "node:assert/strict";

import { syncGoogleCalendarPlanItems } from "../googleCalendarBrowserSync";
import type {
  GoogleCalendarPlanItem,
  GoogleCalendarProvider,
  GoogleCalendarSyncResult,
} from "../types";

function test(_name: string, run: () => void | Promise<void>) {
  const result = run();
  if (result instanceof Promise) {
    result.catch((error: unknown) => {
      throw error;
    });
  }
}

const baseItem: GoogleCalendarPlanItem = {
  actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
  appId: "app-1",
  applicationUrl: "https://app.example.com/dashboard/applications/app-1",
  companyName: "NovaSoft",
  nextActionText: "Call back",
  roleTitle: "Frontend Developer",
};

test("syncGoogleCalendarPlanItems creates new events and stores results", async () => {
  const saved: GoogleCalendarSyncResult[] = [];
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      return { htmlLink: "https://calendar/event-1", id: "event-1" };
    },
    async deleteEvent() {
      throw new Error("Should not delete");
    },
    async updateEvent() {
      throw new Error("Should not update");
    },
  };

  const summary = await syncGoogleCalendarPlanItems({
    items: [baseItem],
    provider,
    repository: {
      async saveResult(_userId, _item, result) {
        saved.push(result);
      },
    },
    userId: "user-1",
  });

  assert.equal(summary.synced, 1);
  assert.equal(saved[0]?.eventId, "event-1");
});

test("syncGoogleCalendarPlanItems updates existing events", async () => {
  let updatedEventId = "";
  const provider: GoogleCalendarProvider = {
    async createEvent() {
      throw new Error("Should not create");
    },
    async deleteEvent() {
      throw new Error("Should not delete");
    },
    async updateEvent(eventId) {
      updatedEventId = eventId;
      return { id: eventId };
    },
  };

  const summary = await syncGoogleCalendarPlanItems({
    items: [{ ...baseItem, googleCalendarEventId: "event-1" }],
    provider,
    repository: {
      async saveResult(_userId, _item, result) {
        assert.equal(result.status, "synced");
      },
    },
    userId: "user-1",
  });

  assert.equal(summary.synced, 1);
  assert.equal(updatedEventId, "event-1");
});
