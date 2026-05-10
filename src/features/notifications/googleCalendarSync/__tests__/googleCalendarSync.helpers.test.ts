import assert from "node:assert/strict";

import {
  buildGoogleCalendarDescription,
  buildGoogleCalendarEventPayload,
  buildGoogleCalendarSummary,
} from "../googleCalendarSync.helpers";
import type { GoogleCalendarPlanItem } from "../types";

function test(_name: string, run: () => void) {
  run();
}

const item: GoogleCalendarPlanItem = {
  actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
  appId: "app-1",
  applicationUrl: "https://app.example.com/dashboard/applications/app-1",
  companyName: "NovaSoft",
  location: "Berlin",
  nextActionText: "Call back",
  roleTitle: "Frontend Developer",
};

test("buildGoogleCalendarSummary formats role and company", () => {
  assert.equal(buildGoogleCalendarSummary(item), "Frontend Developer / NovaSoft");
  assert.equal(
    buildGoogleCalendarSummary({ ...item, companyName: "", roleTitle: "" }),
    "Application / No company",
  );
});

test("buildGoogleCalendarDescription keeps reason and application link", () => {
  assert.equal(
    buildGoogleCalendarDescription(item),
    "Reason: Call back\nApplication: https://app.example.com/dashboard/applications/app-1",
  );
});

test("buildGoogleCalendarEventPayload creates Calendar API payload", () => {
  const payload = buildGoogleCalendarEventPayload({
    durationMinutes: 45,
    item,
    reminderMinutes: 15,
  });

  assert.equal(payload.summary, "Frontend Developer / NovaSoft");
  assert.equal(payload.start.dateTime, "2026-05-20T10:00:00.000Z");
  assert.equal(payload.end.dateTime, "2026-05-20T10:45:00.000Z");
  assert.equal(payload.location, "Berlin");
  assert.deepEqual(payload.reminders.overrides, [
    {
      method: "popup",
      minutes: 15,
    },
  ]);
});
