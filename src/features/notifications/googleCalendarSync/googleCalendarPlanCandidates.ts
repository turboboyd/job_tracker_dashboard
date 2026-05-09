import type { GoogleCalendarPlanItem } from "./types";

const GOOGLE_CALENDAR_PLAN_GRACE_MS = 24 * 60 * 60 * 1000;

export interface GoogleCalendarApplicationRow {
  id: string;
  data: {
    integrations?: {
      googleCalendar?: {
        eventId?: string | null;
      };
    };
    job?: {
      companyName?: string | null;
      locationText?: string | null;
      roleTitle?: string | null;
    };
    process?: {
      nextActionAt?: unknown;
      nextActionText?: string | null;
    };
  };
}

export function buildGoogleCalendarPlanCandidates(
  rows: readonly GoogleCalendarApplicationRow[],
  nowMs: number,
  applicationBaseUrl: string,
): GoogleCalendarPlanItem[] {
  return rows
    .map((row): GoogleCalendarPlanItem | null => {
      const actionAtMs = toCalendarActionMillis(row.data.process?.nextActionAt);
      if (!actionAtMs) return null;
      if (nowMs - actionAtMs > GOOGLE_CALENDAR_PLAN_GRACE_MS) return null;

      return {
        actionAtMs,
        appId: row.id,
        applicationUrl: `${applicationBaseUrl}/${row.id}`,
        companyName: cleanText(row.data.job?.companyName),
        googleCalendarEventId: cleanText(
          row.data.integrations?.googleCalendar?.eventId,
        ),
        location: cleanText(row.data.job?.locationText),
        nextActionText: cleanText(row.data.process?.nextActionText),
        roleTitle: cleanText(row.data.job?.roleTitle),
      };
    })
    .filter((candidate): candidate is GoogleCalendarPlanItem => candidate !== null)
    .sort((left, right) => left.actionAtMs - right.actionAtMs);
}

function toCalendarActionMillis(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }
  if (value instanceof Date) return Number.isFinite(value.getTime()) ? value.getTime() : null;
  if (isToMillisLike(value)) {
    const ms = value.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  if (isRecord(value) && typeof value.seconds === "number") {
    return value.seconds * 1000;
  }

  return null;
}

function cleanText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToMillisLike(value: unknown): value is { toMillis: () => number } {
  return isRecord(value) && typeof value.toMillis === "function";
}
