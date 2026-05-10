import assert from "node:assert/strict";

import type { ApplicationReminderNotificationSettings } from "src/entities/userSettings";

import {
  APPLICATION_REMINDER_GRACE_MS,
  buildApplicationPlanCandidates,
  buildApplicationReminderCandidates,
  buildDailyDigestCandidate,
  buildDailyDigestStorageKey,
  buildReminderStorageKey,
  toReminderMillis,
  type ReminderApplicationRow,
} from "../applicationReminderEngine.helpers";

function test(_name: string, run: () => void) {
  run();
}

const settings: ApplicationReminderNotificationSettings = {
  enabled: true,
  leadTimeMinutes: 30,
  dailyDigestEnabled: false,
  dailyDigestTime: "09:00",
  browserEnabled: true,
  emailEnabled: false,
  googleCalendarEnabled: false,
};
const digestSettings: ApplicationReminderNotificationSettings = {
  ...settings,
  dailyDigestEnabled: true,
  dailyDigestTime: "09:00",
};

const USER_ID = "user-1";
const BASE_TIME_ISO = "2026-05-20T10:00:00Z";
const DIGEST_TODAY_MORNING_ID = "today-morning";
const DIGEST_TODAY_MORNING_AT = new Date(2026, 4, 20, 10, 0);

function row(id: string, nextActionAt: unknown): ReminderApplicationRow {
  return {
    id,
    data: {
      job: {
        companyName: "Company",
        locationText: "Berlin",
        roleTitle: "Role",
      },
      process: {
        nextActionAt,
        nextActionText: "Call back",
      },
    },
  };
}

test("toReminderMillis accepts dates, ISO strings and Firestore-like timestamps", () => {
  assert.equal(toReminderMillis(new Date(BASE_TIME_ISO)), Date.parse(BASE_TIME_ISO));
  assert.equal(toReminderMillis(BASE_TIME_ISO), Date.parse(BASE_TIME_ISO));
  assert.equal(toReminderMillis({ toMillis: () => 1234 }), 1234);
  assert.equal(toReminderMillis({ seconds: 12 }), 12_000);
  assert.equal(toReminderMillis("bad"), null);
});

test("buildApplicationPlanCandidates returns current and future planned actions", () => {
  const nowMs = Date.parse(BASE_TIME_ISO);
  const candidates = buildApplicationPlanCandidates(
    [
      row("future", "2026-05-20T11:00:00Z"),
      row("current", nowMs),
      row("old", nowMs - APPLICATION_REMINDER_GRACE_MS - 1),
    ],
    nowMs,
    "https://app.example.com/dashboard/applications",
  );

  assert.deepEqual(
    candidates.map((candidate) => candidate.appId),
    ["current", "future"],
  );
  assert.equal(
    candidates[0]?.applicationUrl,
    "https://app.example.com/dashboard/applications/current",
  );
  assert.equal(candidates[0]?.location, "Berlin");
});

test("buildApplicationReminderCandidates returns due reminders only once", () => {
  const nowMs = Date.parse(BASE_TIME_ISO);
  const actionAtMs = Date.parse("2026-05-20T10:20:00Z");
  const sentKey = buildReminderStorageKey(USER_ID, "sent", actionAtMs, 30);
  const candidates = buildApplicationReminderCandidates(
    [
      row("future", "2026-05-20T11:00:00Z"),
      row("due", actionAtMs),
      row("sent", actionAtMs),
    ],
    settings,
    nowMs,
    new Set([sentKey]),
    USER_ID,
  );

  assert.deepEqual(candidates.map((candidate) => candidate.appId), ["due"]);
});

test("buildApplicationReminderCandidates skips disabled and too-old reminders", () => {
  const nowMs = Date.parse(BASE_TIME_ISO);
  const oldActionMs = nowMs - APPLICATION_REMINDER_GRACE_MS - 1;

  assert.equal(
    buildApplicationReminderCandidates(
      [row("old", oldActionMs)],
      settings,
      nowMs,
      new Set(),
      USER_ID,
    ).length,
    0,
  );
  assert.equal(
    buildApplicationReminderCandidates(
      [row("due", nowMs)],
      { ...settings, enabled: false },
      nowMs,
      new Set(),
      USER_ID,
    ).length,
    0,
  );
});

test("buildApplicationReminderCandidates is channel agnostic", () => {
  const nowMs = Date.parse(BASE_TIME_ISO);
  const candidates = buildApplicationReminderCandidates(
    [row("due", Date.parse("2026-05-20T10:20:00Z"))],
    { ...settings, browserEnabled: false, emailEnabled: true },
    nowMs,
    new Set(),
    USER_ID,
  );

  assert.deepEqual(candidates.map((candidate) => candidate.appId), ["due"]);
});

test("buildDailyDigestCandidate returns today's items after digest time once", () => {
  const nowMs = new Date(2026, 4, 20, 9, 5).getTime();
  const digest = buildDailyDigestCandidate(
    [
      row(DIGEST_TODAY_MORNING_ID, DIGEST_TODAY_MORNING_AT),
      row("today-afternoon", new Date(2026, 4, 20, 15, 30)),
      row("tomorrow", new Date(2026, 4, 21, 9, 0)),
    ],
    digestSettings,
    nowMs,
    new Set(),
    USER_ID,
  );

  assert.ok(digest);
  assert.equal(digest.count, 2);
  assert.deepEqual(
    digest.items.map((item) => item.appId),
    [DIGEST_TODAY_MORNING_ID, "today-afternoon"],
  );

  const sentKey = buildDailyDigestStorageKey(
    USER_ID,
    digest.dateKey,
    digestSettings.dailyDigestTime,
  );

  assert.equal(
    buildDailyDigestCandidate(
      [row(DIGEST_TODAY_MORNING_ID, DIGEST_TODAY_MORNING_AT)],
      digestSettings,
      nowMs,
      new Set([sentKey]),
      USER_ID,
    ),
    null,
  );
});

test("buildDailyDigestCandidate waits until the configured digest time", () => {
  const nowMs = new Date(2026, 4, 20, 8, 59).getTime();

  assert.equal(
    buildDailyDigestCandidate(
      [row("today", DIGEST_TODAY_MORNING_AT)],
      digestSettings,
      nowMs,
      new Set(),
      USER_ID,
    ),
    null,
  );
});
