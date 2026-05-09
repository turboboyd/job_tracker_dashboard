import assert from "node:assert/strict";

import {
  buildGoogleCalendarOutboxId,
  buildGoogleCalendarOutboxItems,
} from "../googleCalendarOutbox.helpers";
import type { GoogleCalendarPlanItem } from "../types";

function test(_name: string, run: () => void) {
  run();
}

const item: GoogleCalendarPlanItem = {
  actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
  appId: "app-1",
  applicationUrl: "",
  companyName: "NovaSoft",
  location: " Berlin ",
  nextActionText: "Call back",
  roleTitle: "Frontend Developer",
};

test("buildGoogleCalendarOutboxItems creates pending sync docs", () => {
  const [outboxItem] = buildGoogleCalendarOutboxItems({
    applicationBaseUrl: "https://app.example.com/dashboard/applications",
    candidates: [item],
    nowMs: Date.parse("2026-05-01T09:00:00Z"),
    userId: "user-1",
  });

  assert.ok(outboxItem);
  assert.equal(outboxItem.doc.channel, "google_calendar");
  assert.equal(outboxItem.doc.kind, "application_plan");
  assert.equal(outboxItem.doc.status, "pending");
  assert.equal(outboxItem.doc.action, "create");
  assert.equal(
    outboxItem.doc.payload.applicationUrl,
    "https://app.example.com/dashboard/applications/app-1",
  );
  assert.equal(outboxItem.doc.payload.location, "Berlin");
});

test("buildGoogleCalendarOutboxId is stable and compact", () => {
  const id = buildGoogleCalendarOutboxId(
    "google_calendar:app-1:1779271200000:Frontend Developer:NovaSoft:Call back",
  );

  assert.equal(
    id,
    buildGoogleCalendarOutboxId(
      "google_calendar:app-1:1779271200000:Frontend Developer:NovaSoft:Call back",
    ),
  );
  assert.ok(id.length <= 112);
  assert.match(id, /^[a-z0-9_-]+$/);
});
