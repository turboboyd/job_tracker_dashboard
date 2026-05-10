import {
  processGoogleCalendarOutboxBatch,
  type GoogleCalendarOutboxRepository,
  type GoogleCalendarProviderResolver,
  type ProcessGoogleCalendarOutboxBatchOptions,
} from "./googleCalendarOutbox.processor";
import { createGoogleCalendarProvider } from "./googleCalendarProvider";
import type {
  GoogleCalendarOutboxDoc,
  GoogleCalendarOutboxDueQuery,
  GoogleCalendarOutboxItem,
  GoogleCalendarOutboxWorkerResult,
  GoogleCalendarPlanItem,
  GoogleCalendarSyncedEvent,
} from "./types";

interface AdminDocumentReferenceLike {
  update: (data: Record<string, unknown>) => Promise<void>;
}

interface AdminDocumentSnapshotLike {
  id: string;
  data: () => Record<string, unknown> | undefined;
  ref: AdminDocumentReferenceLike;
}

interface AdminQuerySnapshotLike {
  docs: AdminDocumentSnapshotLike[];
}

interface AdminQueryLike {
  get: () => Promise<AdminQuerySnapshotLike>;
  limit: (value: number) => AdminQueryLike;
  orderBy: (field: string, direction?: "asc" | "desc") => AdminQueryLike;
  where: (field: string, operator: string, value: unknown) => AdminQueryLike;
}

export interface AdminFirestoreLike {
  collectionGroup: (collectionId: string) => AdminQueryLike;
}

export interface GoogleCalendarCredentials {
  accessToken: string;
  calendarId?: string | undefined;
}

export interface GoogleCalendarCredentialsResolver {
  resolve: (userId: string) => Promise<GoogleCalendarCredentials | null>;
}

export interface GoogleCalendarOutboxRuntime {
  run: (
    overrides?: Partial<
      Pick<ProcessGoogleCalendarOutboxBatchOptions, "limit" | "now">
    >,
  ) => ReturnType<typeof processGoogleCalendarOutboxBatch>;
}

export function createFirestoreGoogleCalendarOutboxRepository(
  db: AdminFirestoreLike,
): GoogleCalendarOutboxRepository {
  const refsById = new Map<string, AdminDocumentReferenceLike>();

  return {
    async applyResult(result: GoogleCalendarOutboxWorkerResult) {
      const ref = refsById.get(result.id);
      if (!ref) {
        throw new Error(`Google Calendar outbox reference is missing for ${result.id}`);
      }

      await ref.update(toFirestorePatch(result));
    },
    async findLatestSyncedEvent(userId, appId) {
      const snapshot = await db
        .collectionGroup("notificationOutbox")
        .where("channel", "==", "google_calendar")
        .where("userId", "==", userId)
        .where("payload.appId", "==", appId)
        .where("status", "==", "synced")
        .orderBy("lastAttemptAt", "desc")
        .limit(1)
        .get();

      const doc = snapshot.docs[0]?.data();
      if (!doc) return null;

      return toSyncedEvent(doc);
    },
    async listDue(query: GoogleCalendarOutboxDueQuery) {
      const snapshot = await db
        .collectionGroup("notificationOutbox")
        .where("channel", "==", "google_calendar")
        .where("status", "in", ["pending", "failed"])
        .where("sendAfter", "<=", query.now)
        .orderBy("sendAfter", "asc")
        .limit(query.limit)
        .get();

      return snapshot.docs.flatMap((snapshotDoc) => {
        const item = toGoogleCalendarOutboxItem(snapshotDoc);
        if (!item) return [];

        refsById.set(item.id, snapshotDoc.ref);
        return [item];
      });
    },
  };
}

export function createGoogleCalendarCredentialsProviderResolver(
  credentialsResolver: GoogleCalendarCredentialsResolver,
): GoogleCalendarProviderResolver {
  return {
    async resolve(userId) {
      const credentials = await credentialsResolver.resolve(userId);
      if (!credentials?.accessToken) return null;

      return createGoogleCalendarProvider({
        accessToken: credentials.accessToken,
        calendarId: credentials.calendarId,
      });
    },
  };
}

export function createGoogleCalendarOutboxRuntime(
  options: ProcessGoogleCalendarOutboxBatchOptions,
): GoogleCalendarOutboxRuntime {
  return {
    run: (overrides = {}) =>
      processGoogleCalendarOutboxBatch({
        ...options,
        ...overrides,
      }),
  };
}

function toGoogleCalendarOutboxItem(
  snapshotDoc: AdminDocumentSnapshotLike,
): GoogleCalendarOutboxItem | null {
  const data = snapshotDoc.data();
  if (!data) return null;

  const doc = toGoogleCalendarOutboxDoc(data);
  if (!doc) return null;

  return {
    doc,
    id: snapshotDoc.id,
  };
}

function toGoogleCalendarOutboxDoc(
  data: Record<string, unknown>,
): GoogleCalendarOutboxDoc | null {
  if (data.channel !== "google_calendar") return null;
  if (data.kind !== "application_plan") return null;

  const createdAt = toDate(data.createdAt);
  const sendAfter = toDate(data.sendAfter);
  const payload = toPlanItem(data.payload);
  if (!createdAt || !sendAfter || !payload) return null;
  if (!isGoogleCalendarAction(data.action)) return null;
  if (!isGoogleCalendarOutboxStatus(data.status)) return null;
  if (typeof data.dedupeKey !== "string") return null;
  if (typeof data.userId !== "string") return null;

  return compactUndefined({
    action: data.action,
    attemptCount: toOptionalNumber(data.attemptCount),
    channel: "google_calendar" as const,
    createdAt,
    dedupeKey: data.dedupeKey,
    deletedAt: toOptionalDate(data.deletedAt),
    errorMessage: toOptionalString(data.errorMessage),
    eventId: toOptionalString(data.eventId),
    failedAt: toOptionalDate(data.failedAt),
    htmlLink: toOptionalString(data.htmlLink),
    kind: "application_plan" as const,
    lastAttemptAt: toOptionalDate(data.lastAttemptAt),
    nextRetryAt: toOptionalDate(data.nextRetryAt),
    payload,
    sendAfter,
    status: data.status,
    syncedAt: toOptionalDate(data.syncedAt),
    userId: data.userId,
  });
}

function toPlanItem(value: unknown): GoogleCalendarPlanItem | null {
  if (!isRecord(value)) return null;
  if (typeof value.actionAtMs !== "number") return null;
  if (typeof value.appId !== "string") return null;
  if (typeof value.applicationUrl !== "string") return null;
  if (typeof value.companyName !== "string") return null;
  if (typeof value.nextActionText !== "string") return null;
  if (typeof value.roleTitle !== "string") return null;

  return compactUndefined({
    actionAtMs: value.actionAtMs,
    appId: value.appId,
    applicationUrl: value.applicationUrl,
    companyName: value.companyName,
    location: toOptionalString(value.location),
    nextActionText: value.nextActionText,
    roleTitle: value.roleTitle,
  });
}

function toSyncedEvent(data: Record<string, unknown>): GoogleCalendarSyncedEvent | null {
  if (typeof data.eventId !== "string" || !data.eventId.trim()) return null;

  return compactUndefined({
    htmlLink: toOptionalString(data.htmlLink),
    id: data.eventId,
  });
}

function toFirestorePatch(
  result: GoogleCalendarOutboxWorkerResult,
): Record<string, unknown> {
  return compactUndefined({ ...result.patch });
}

function compactUndefined<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, entry]) => entry !== undefined,
    ),
  ) as T;
}

function toOptionalDate(value: unknown): Date | undefined {
  return toDate(value) ?? undefined;
}

function toDate(value: unknown): Date | null {
  const primitiveDate = toPrimitiveDate(value);
  if (primitiveDate) return primitiveDate;

  return toTimestampLikeDate(value);
}

function toPrimitiveDate(value: unknown): Date | null {
  if (value instanceof Date) {
    return toValidDate(value);
  }

  if (typeof value === "number") {
    return toValidDate(new Date(value));
  }

  if (typeof value === "string") {
    return toValidDate(new Date(value));
  }

  return null;
}

function toTimestampLikeDate(value: unknown): Date | null {
  if (isToDateLike(value)) {
    const date = value.toDate();
    return date instanceof Date ? toValidDate(date) : null;
  }

  if (isToMillisLike(value)) {
    return toValidDate(new Date(value.toMillis()));
  }

  if (isRecord(value) && typeof value.seconds === "number") {
    return toValidDate(new Date(value.seconds * 1000));
  }

  return null;
}

function toValidDate(date: Date): Date | null {
  return Number.isNaN(date.getTime()) ? null : date;
}

function toOptionalNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isGoogleCalendarAction(value: unknown): value is GoogleCalendarOutboxDoc["action"] {
  return value === "create" || value === "delete" || value === "update";
}

function isGoogleCalendarOutboxStatus(
  value: unknown,
): value is GoogleCalendarOutboxDoc["status"] {
  return (
    value === "deleted" ||
    value === "failed" ||
    value === "pending" ||
    value === "synced"
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToDateLike(value: unknown): value is { toDate: () => unknown } {
  return isRecord(value) && typeof value.toDate === "function";
}

function isToMillisLike(value: unknown): value is { toMillis: () => number } {
  return isRecord(value) && typeof value.toMillis === "function";
}
