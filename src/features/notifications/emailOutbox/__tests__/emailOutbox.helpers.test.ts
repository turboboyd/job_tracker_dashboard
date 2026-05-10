import assert from "node:assert/strict";

import {
  buildEmailOutboxId,
  buildReminderEmailOutboxItems,
} from "../emailOutbox.helpers";

function test(_name: string, run: () => void) {
  run();
}

const USER_ID = "user-1";
const NOW_MS = Date.parse("2026-05-20T09:00:00Z");
const APPLICATION_BASE_URL = "https://app.example.com/dashboard/applications";
const CALENDAR_URL = "https://app.example.com/dashboard/calendar";

test("buildReminderEmailOutboxItems creates reminder and digest queue docs", () => {
  const items = buildReminderEmailOutboxItems({
    applicationBaseUrl: APPLICATION_BASE_URL,
    calendarUrl: CALENDAR_URL,
    candidates: [
      {
        actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
        appId: "app-1",
        companyName: "NovaSoft",
        key: "user-1:app-1:178000:30",
        nextActionText: "Call back",
        roleTitle: "Frontend Developer",
      },
    ],
    digestCandidate: {
      count: 1,
      dateKey: "2026-05-20",
      items: [
        {
          actionAtMs: Date.parse("2026-05-20T10:00:00Z"),
          appId: "app-1",
          companyName: "NovaSoft",
          key: "user-1:app-1:178000:30",
          nextActionText: "Call back",
          roleTitle: "Frontend Developer",
        },
      ],
      key: "user-1:dailyDigest:2026-05-20:09:00",
    },
    language: "en",
    nowMs: NOW_MS,
    userId: USER_ID,
  });

  assert.equal(items.length, 2);
  const reminder = items[0]?.doc;
  const digest = items[1]?.doc;

  assert.ok(reminder);
  assert.ok(digest);
  assert.equal(reminder.kind, "application_reminder");
  assert.equal(reminder.status, "pending");
  assert.equal(reminder.payload.applicationUrl, `${APPLICATION_BASE_URL}/app-1`);
  assert.equal(digest.kind, "application_daily_digest");
  assert.equal(digest.payload.calendarUrl, CALENDAR_URL);
});

test("buildEmailOutboxId is deterministic and Firestore-safe", () => {
  const id = buildEmailOutboxId(
    "application_reminder",
    "email:user-1:app/id:2026-05-20:30",
  );

  assert.equal(
    id,
    buildEmailOutboxId("application_reminder", "email:user-1:app/id:2026-05-20:30"),
  );
  assert.doesNotMatch(id, /\//);
  assert.ok(id.length < 120);
});
