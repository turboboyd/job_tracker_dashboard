import type { ApplicationReminderNotificationSettings } from "src/entities/userSettings";
import type { GoogleCalendarPlanItem } from "src/features/notifications/googleCalendarSync";

export const APPLICATION_REMINDER_CHECK_INTERVAL_MS = 60 * 1000;
export const APPLICATION_REMINDER_FETCH_LIMIT = 500;
export const APPLICATION_REMINDER_GRACE_MS = 24 * 60 * 60 * 1000;
export const APPLICATION_REMINDER_MAX_PER_TICK = 3;

const STORAGE_PREFIX = "jobTracker.applicationReminders.sent.v1";
const MAX_STORED_KEYS = 300;

export interface ReminderApplicationRow {
  id: string;
  data: {
    job?: {
      companyName?: string | null;
      locationText?: string | null;
      roleTitle?: string | null;
    };
    process?: {
      nextActionAt?: unknown;
      nextActionText?: string | null;
    };
    integrations?: {
      googleCalendar?: {
        eventId?: string | null;
      };
    };
  };
}

export interface ApplicationReminderCandidate {
  actionAtMs: number;
  appId: string;
  companyName: string;
  key: string;
  nextActionText: string;
  roleTitle: string;
}

export interface ApplicationDailyDigestCandidate {
  count: number;
  dateKey: string;
  items: ApplicationReminderCandidate[];
  key: string;
}

export function buildApplicationPlanCandidates(
  rows: readonly ReminderApplicationRow[],
  nowMs: number,
  applicationBaseUrl: string,
): GoogleCalendarPlanItem[] {
  return rows
    .map((row): GoogleCalendarPlanItem | null => {
      const actionAtMs = toReminderMillis(row.data.process?.nextActionAt);
      if (!actionAtMs) return null;

      const isTooOld = nowMs - actionAtMs > APPLICATION_REMINDER_GRACE_MS;
      if (isTooOld) return null;

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

interface TimestampMillisLike {
  toMillis: () => number;
}

interface TimestampSecondsLike {
  seconds: number;
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimestampMillisLike(value: unknown): value is TimestampMillisLike {
  return isObject(value) && typeof value.toMillis === "function";
}

function isTimestampSecondsLike(value: unknown): value is TimestampSecondsLike {
  return isObject(value) && typeof value.seconds === "number";
}

export function toReminderMillis(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : null;
  }

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value.getTime() : null;
  }

  if (isTimestampMillisLike(value)) {
    const ms = value.toMillis();
    return Number.isFinite(ms) ? ms : null;
  }

  if (isTimestampSecondsLike(value)) {
    return value.seconds * 1000;
  }

  return null;
}

export function buildReminderStorageKey(
  userId: string,
  appId: string,
  actionAtMs: number,
  leadTimeMinutes: number,
): string {
  return [userId, appId, actionAtMs, leadTimeMinutes].join(":");
}

export function buildDailyDigestStorageKey(
  userId: string,
  dateKey: string,
  digestTime: string,
): string {
  return [userId, "dailyDigest", dateKey, digestTime].join(":");
}

export function buildApplicationReminderCandidates(
  rows: readonly ReminderApplicationRow[],
  settings: ApplicationReminderNotificationSettings,
  nowMs: number,
  sentKeys: ReadonlySet<string>,
  userId: string,
): ApplicationReminderCandidate[] {
  if (!settings.enabled) {
    return [];
  }

  const leadTimeMs = settings.leadTimeMinutes * 60 * 1000;

  return rows
    .map((row): ApplicationReminderCandidate | null => {
      const actionAtMs = toReminderMillis(row.data.process?.nextActionAt);
      if (!actionAtMs) return null;

      const triggerAtMs = actionAtMs - leadTimeMs;
      const isDue = nowMs >= triggerAtMs;
      const isTooOld = nowMs - actionAtMs > APPLICATION_REMINDER_GRACE_MS;
      if (!isDue || isTooOld) return null;

      const key = buildReminderStorageKey(
        userId,
        row.id,
        actionAtMs,
        settings.leadTimeMinutes,
      );
      if (sentKeys.has(key)) return null;

      return {
        actionAtMs,
        appId: row.id,
        companyName: cleanText(row.data.job?.companyName),
        key,
        nextActionText: cleanText(row.data.process?.nextActionText),
        roleTitle: cleanText(row.data.job?.roleTitle),
      };
    })
    .filter((candidate): candidate is ApplicationReminderCandidate => candidate !== null)
    .sort((left, right) => left.actionAtMs - right.actionAtMs)
    .slice(0, APPLICATION_REMINDER_MAX_PER_TICK);
}

export function buildDailyDigestCandidate(
  rows: readonly ReminderApplicationRow[],
  settings: ApplicationReminderNotificationSettings,
  nowMs: number,
  sentKeys: ReadonlySet<string>,
  userId: string,
): ApplicationDailyDigestCandidate | null {
  if (!settings.enabled || !settings.dailyDigestEnabled) {
    return null;
  }

  const now = new Date(nowMs);
  if (getLocalMinutes(now) < parseDigestTimeMinutes(settings.dailyDigestTime)) {
    return null;
  }

  const dateKey = getLocalDateKey(now);
  const key = buildDailyDigestStorageKey(userId, dateKey, settings.dailyDigestTime);
  if (sentKeys.has(key)) return null;

  const items = rows
    .map((row): ApplicationReminderCandidate | null => {
      const actionAtMs = toReminderMillis(row.data.process?.nextActionAt);
      if (!actionAtMs) return null;
      if (getLocalDateKey(new Date(actionAtMs)) !== dateKey) return null;

      return {
        actionAtMs,
        appId: row.id,
        companyName: cleanText(row.data.job?.companyName),
        key: buildReminderStorageKey(
          userId,
          row.id,
          actionAtMs,
          settings.leadTimeMinutes,
        ),
        nextActionText: cleanText(row.data.process?.nextActionText),
        roleTitle: cleanText(row.data.job?.roleTitle),
      };
    })
    .filter((item): item is ApplicationReminderCandidate => item !== null)
    .sort((left, right) => left.actionAtMs - right.actionAtMs);

  return items.length > 0
    ? {
        count: items.length,
        dateKey,
        items,
        key,
      }
    : null;
}

export function getReminderStorageName(userId: string): string {
  return `${STORAGE_PREFIX}.${userId}`;
}

// ─── Interaction next-step reminders ─────────────────────────────────────────

/**
 * Minimal shape of an interaction row as returned by Firestore.
 * Mirrors InteractionDoc but without full import to keep helpers pure.
 */
export interface ReminderInteractionRow {
  id: string;
  data: {
    nextStepAt?: unknown;
    nextStepText?: string | null;
    type?: string | null;
    contactDisplayName?: string | null;
    applicationDisplayTitle?: string | null;
  };
}

export interface InteractionNextStepCandidate {
  /** Millisecond epoch of nextStepAt */
  nextStepAtMs: number;
  interactionId: string;
  /** Storage dedup key */
  key: string;
  /** Short label for the notification body */
  summary: string;
}

/**
 * Build candidates for interaction next-step browser notifications.
 * Uses the same lead-time and grace-period logic as application reminders.
 */
export function buildInteractionNextStepCandidates(
  rows: readonly ReminderInteractionRow[],
  leadTimeMinutes: number,
  nowMs: number,
  sentKeys: ReadonlySet<string>,
  userId: string,
): InteractionNextStepCandidate[] {
  const leadTimeMs = leadTimeMinutes * 60 * 1000;

  return rows
    .map((row): InteractionNextStepCandidate | null => {
      const nextStepAtMs = toReminderMillis(row.data.nextStepAt);
      if (!nextStepAtMs) return null;

      const triggerAtMs = nextStepAtMs - leadTimeMs;
      const isDue = nowMs >= triggerAtMs;
      const isTooOld = nowMs - nextStepAtMs > APPLICATION_REMINDER_GRACE_MS;
      if (!isDue || isTooOld) return null;

      const key = [userId, "interaction", row.id, nextStepAtMs, leadTimeMinutes].join(":");
      if (sentKeys.has(key)) return null;

      const contactPart = row.data.contactDisplayName
        ? ` — ${row.data.contactDisplayName}`
        : "";
      const appPart = row.data.applicationDisplayTitle
        ? ` (${row.data.applicationDisplayTitle})`
        : "";
      const actionPart = row.data.nextStepText
        ? `: ${row.data.nextStepText}`
        : "";

      const summary = `${row.data.type ?? "Follow-up"}${contactPart}${appPart}${actionPart}`;

      return { nextStepAtMs, interactionId: row.id, key, summary };
    })
    .filter((c): c is InteractionNextStepCandidate => c !== null)
    .sort((a, b) => a.nextStepAtMs - b.nextStepAtMs)
    .slice(0, APPLICATION_REMINDER_MAX_PER_TICK);
}

export function readSentReminderKeys(userId: string): Set<string> {
  if (typeof window === "undefined") return new Set();

  try {
    const raw = window.localStorage.getItem(getReminderStorageName(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed.filter(isString) : []);
  } catch {
    return new Set();
  }
}

export function writeSentReminderKeys(userId: string, keys: Iterable<string>): void {
  if (typeof window === "undefined") return;

  try {
    const next = Array.from(keys).slice(-MAX_STORED_KEYS);
    window.localStorage.setItem(getReminderStorageName(userId), JSON.stringify(next));
  } catch {
    // localStorage can be blocked; reminders should not break the app.
  }
}

function cleanText(value: string | null | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

function getLocalDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getLocalMinutes(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

function parseDigestTimeMinutes(value: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return 9 * 60;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return 9 * 60;

  return hours * 60 + minutes;
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}
