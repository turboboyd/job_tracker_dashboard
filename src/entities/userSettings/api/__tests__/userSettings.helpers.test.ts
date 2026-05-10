import assert from "node:assert/strict";

import {
  DEFAULT_USER_SETTINGS,
  normalizeNotificationSettings,
  normalizeSettings,
} from "../userSettings.helpers";

function test(_name: string, run: () => void) {
  run();
}

test("normalizeSettings adds default notification settings", () => {
  const settings = normalizeSettings({
    dateFormat: "YYYY-MM-DD",
    timeZone: "Europe/Warsaw",
  });

  assert.equal(settings.notifications.applicationReminders.enabled, true);
  assert.equal(settings.notifications.applicationReminders.leadTimeMinutes, 30);
  assert.equal(settings.notifications.applicationReminders.dailyDigestTime, "09:00");
});

test("normalizeNotificationSettings keeps valid values and clamps lead time", () => {
  const settings = normalizeNotificationSettings({
    applicationReminders: {
      enabled: false,
      leadTimeMinutes: 2000,
      dailyDigestEnabled: true,
      dailyDigestTime: "08:30",
      browserEnabled: false,
      emailEnabled: true,
      googleCalendarEnabled: true,
    },
  });

  assert.equal(settings.applicationReminders.enabled, false);
  assert.equal(settings.applicationReminders.leadTimeMinutes, 1440);
  assert.equal(settings.applicationReminders.dailyDigestEnabled, true);
  assert.equal(settings.applicationReminders.dailyDigestTime, "08:30");
  assert.equal(settings.applicationReminders.emailEnabled, true);
});

test("normalizeNotificationSettings falls back when time is invalid", () => {
  const settings = normalizeNotificationSettings({
    applicationReminders: {
      ...DEFAULT_USER_SETTINGS.notifications.applicationReminders,
      dailyDigestTime: "bad",
    },
  });

  assert.equal(
    settings.applicationReminders.dailyDigestTime,
    DEFAULT_USER_SETTINGS.notifications.applicationReminders.dailyDigestTime,
  );
});
