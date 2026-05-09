import type {
  GoogleCalendarEventPayload,
  GoogleCalendarPlanItem,
} from "./types";

const DEFAULT_EVENT_DURATION_MINUTES = 30;
const DEFAULT_REMINDER_MINUTES = 10;

interface BuildGoogleCalendarEventPayloadOptions {
  durationMinutes?: number | undefined;
  item: GoogleCalendarPlanItem;
  reminderMinutes?: number | undefined;
}

export function buildGoogleCalendarEventPayload({
  durationMinutes = DEFAULT_EVENT_DURATION_MINUTES,
  item,
  reminderMinutes = DEFAULT_REMINDER_MINUTES,
}: BuildGoogleCalendarEventPayloadOptions): GoogleCalendarEventPayload {
  const startsAt = new Date(item.actionAtMs);
  const endsAt = new Date(item.actionAtMs + durationMinutes * 60 * 1000);
  const summary = buildGoogleCalendarSummary(item);
  const description = buildGoogleCalendarDescription(item);
  const basePayload: GoogleCalendarEventPayload = {
    description,
    end: {
      dateTime: endsAt.toISOString(),
    },
    reminders: {
      overrides: [
        {
          method: "popup",
          minutes: reminderMinutes,
        },
      ],
      useDefault: false,
    },
    source: {
      title: "Job Tracker Dashboard",
      url: item.applicationUrl,
    },
    start: {
      dateTime: startsAt.toISOString(),
    },
    summary,
  };

  return item.location?.trim()
    ? { ...basePayload, location: item.location.trim() }
    : basePayload;
}

export function buildGoogleCalendarSummary(item: GoogleCalendarPlanItem): string {
  const roleTitle = getTextOrFallback(item.roleTitle, "Application");
  const companyName = getTextOrFallback(item.companyName, "No company");

  return `${roleTitle} / ${companyName}`;
}

export function buildGoogleCalendarDescription(item: GoogleCalendarPlanItem): string {
  return [
    item.nextActionText.trim() ? `Reason: ${item.nextActionText.trim()}` : "",
    `Application: ${item.applicationUrl}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function getTextOrFallback(value: string, fallback: string): string {
  const trimmed = value.trim();
  if (!trimmed) return fallback;

  return trimmed;
}
