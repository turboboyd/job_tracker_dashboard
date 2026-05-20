import { normalizeStatusKey, type StatusKey } from "src/entities/application";
import type {
  ApplicationDoc,
  HistoryEventDoc,
  ProcessStatus,
} from "src/features/applications";

export type HistoryFilter = "all" | "statuses" | "comments";

export interface ApplicationHistoryItem {
  id: string;
  data: HistoryEventDoc;
}

export const STATUS_BUTTONS: ProcessStatus[] = [
  "SAVED",
  "APPLIED",
  "INTERVIEW_1",
  "OFFER",
  "REJECTED",
  "NO_RESPONSE",
];

export function toStatusKey(status: ProcessStatus | undefined): StatusKey {
  return normalizeStatusKey(status) ?? "SAVED";
}

export function toDateOptional(value: unknown): Date | null {
  if (!value) return null;

  try {
    const maybe = value as { toDate?: unknown };
    const date =
      typeof maybe.toDate === "function"
        ? (maybe.toDate as () => Date)()
        : new Date(value as never);

    return Number.isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

export function formatDateInput(value: unknown): string {
  const date = toDateOptional(value);
  if (!date) return "";

  return [
    date.getFullYear(),
    padDatePart(date.getMonth() + 1),
    padDatePart(date.getDate()),
  ].join("-");
}

export function formatTimeInput(value: unknown): string {
  const date = toDateOptional(value);
  if (!date) return "";

  return [padDatePart(date.getHours()), padDatePart(date.getMinutes())].join(":");
}

export function createDateTimeFromInputs(
  dateValue: string,
  timeValue: string,
): Date | null {
  if (!dateValue) return null;

  const next = new Date(`${dateValue}T${timeValue || "09:00"}`);
  return Number.isNaN(next.getTime()) ? null : next;
}

// ─── Date math (no external lib) ─────────────────────────────────────────────

export function startOfDay(date: Date): Date {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function addMonths(date: Date, months: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

export function setHourMinute(date: Date, hour: number, minute: number): Date {
  const next = new Date(date);
  next.setHours(hour, minute, 0, 0);
  return next;
}

export type ReminderValidationCode =
  | "ok"
  | "missing_date"
  | "invalid_format"
  | "in_past";

export interface ReminderValidationResult {
  code: ReminderValidationCode;
  /** Resolved Date when code === "ok" */
  date: Date | null;
}

/**
 * Validate a (date, time) pair from native inputs.
 * Future-only: any past datetime is rejected. No upper bound.
 */
export function validateReminderInputs(
  dateValue: string,
  timeValue: string,
  now: Date = new Date(),
): ReminderValidationResult {
  if (!dateValue.trim()) return { code: "missing_date", date: null };

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    return { code: "invalid_format", date: null };
  }
  if (timeValue && !/^\d{2}:\d{2}$/.test(timeValue)) {
    return { code: "invalid_format", date: null };
  }

  const candidate = new Date(`${dateValue}T${timeValue || "09:00"}`);
  if (Number.isNaN(candidate.getTime())) {
    return { code: "invalid_format", date: null };
  }

  if (candidate.getTime() <= now.getTime()) {
    return { code: "in_past", date: null };
  }

  return { code: "ok", date: candidate };
}

/**
 * Resolve a (date, time) pair to a Date even if it's in the past.
 * Used for displaying overdue reminders ("просрочено") in the list.
 */
export function resolveReminderDate(
  dateValue: string,
  timeValue: string,
): Date | null {
  if (!dateValue.trim()) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) return null;
  if (timeValue && !/^\d{2}:\d{2}$/.test(timeValue)) return null;
  const candidate = new Date(`${dateValue}T${timeValue || "09:00"}`);
  return Number.isNaN(candidate.getTime()) ? null : candidate;
}

// ─── Quick presets (used by reminder popup) ──────────────────────────────────

export type ReminderPresetId =
  | "tomorrow"
  | "in_3_days"
  | "in_1_week"
  | "in_2_weeks"
  | "in_1_month";

export interface ReminderPreset {
  id: ReminderPresetId;
  /** Returns a Date with hour fixed at the supplied default hour (e.g. 09:00). */
  resolve: (now: Date, defaultHour: number, defaultMinute: number) => Date;
}

export const REMINDER_PRESETS: readonly ReminderPreset[] = [
  {
    id: "tomorrow",
    resolve: (now, h, m) => setHourMinute(addDays(startOfDay(now), 1), h, m),
  },
  {
    id: "in_3_days",
    resolve: (now, h, m) => setHourMinute(addDays(startOfDay(now), 3), h, m),
  },
  {
    id: "in_1_week",
    resolve: (now, h, m) => setHourMinute(addDays(startOfDay(now), 7), h, m),
  },
  {
    id: "in_2_weeks",
    resolve: (now, h, m) => setHourMinute(addDays(startOfDay(now), 14), h, m),
  },
  {
    id: "in_1_month",
    resolve: (now, h, m) => setHourMinute(addMonths(startOfDay(now), 1), h, m),
  },
];

/** Format a Date as a short locale-aware label like "Fri, 16 May · 09:00" */
export function formatReminderShort(date: Date, locale?: string): string {
  const dayPart = date.toLocaleDateString(locale, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const timePart = date.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${dayPart} · ${timePart}`;
}

export function formatTs(ts: unknown): string {
  const date = toDateOptional(ts);
  return date ? date.toLocaleString() : "";
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getApplicationVacancyDescription(
  app: ApplicationDoc | null,
): string {
  return app?.vacancy?.rawDescription?.trim() ?? "";
}

export function buildApplicationTitle(app: ApplicationDoc | null) {
  if (!app) {
    return "";
  }

  return `${app.job.roleTitle} / ${app.job.companyName}`;
}

export function filterApplicationHistory(
  history: ApplicationHistoryItem[],
  historyFilter: HistoryFilter,
) {
  if (historyFilter === "all") {
    return history;
  }

  if (historyFilter === "statuses") {
    return history.filter((item) => item.data.type === "STATUS_CHANGE");
  }

  return history.filter((item) => item.data.type === "COMMENT");
}

function padDatePart(value: number): string {
  return String(value).padStart(2, "0");
}
