import type {
  ApplicationReminderNotificationSettings,
  UserSettings,
} from "src/entities/userSettings";

export const REMINDER_LEAD_TIME_OPTIONS = [0, 5, 15, 30, 60, 120, 1440] as const;

export type ReminderLeadTimeOption = (typeof REMINDER_LEAD_TIME_OPTIONS)[number];

export function getReminderSettings(
  settings: UserSettings,
): ApplicationReminderNotificationSettings {
  return settings.notifications.applicationReminders;
}

export function hasNotificationSettingsChanges(
  initial: ApplicationReminderNotificationSettings,
  current: ApplicationReminderNotificationSettings,
): boolean {
  return (
    initial.enabled !== current.enabled ||
    initial.leadTimeMinutes !== current.leadTimeMinutes ||
    initial.dailyDigestEnabled !== current.dailyDigestEnabled ||
    initial.dailyDigestTime !== current.dailyDigestTime ||
    initial.browserEnabled !== current.browserEnabled ||
    initial.emailEnabled !== current.emailEnabled ||
    initial.googleCalendarEnabled !== current.googleCalendarEnabled
  );
}

export function normalizeReminderLeadTime(value: string): ReminderLeadTimeOption {
  const parsed = Number(value);

  return REMINDER_LEAD_TIME_OPTIONS.includes(parsed as ReminderLeadTimeOption)
    ? (parsed as ReminderLeadTimeOption)
    : 30;
}

export function getNotificationErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  return "Failed to save notification settings";
}

export function isBrowserNotificationApiAvailable(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (!isBrowserNotificationApiAvailable()) return "unsupported";

  return window.Notification.permission;
}
