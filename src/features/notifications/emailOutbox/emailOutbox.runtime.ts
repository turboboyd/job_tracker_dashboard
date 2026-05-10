import {
  processEmailOutboxBatch,
  type EmailOutboxBatchSummary,
  type EmailOutboxRepository,
  type EmailRecipientResolver,
  type ProcessEmailOutboxBatchOptions,
} from "./emailOutbox.processor";
import type {
  EmailOutboxDailyDigestPayload,
  EmailOutboxDoc,
  EmailOutboxDueQuery,
  EmailOutboxItem,
  EmailOutboxReminderPayload,
  EmailOutboxWorkerResult,
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

export interface AdminAuthUserLike {
  disabled?: boolean | undefined;
  displayName?: string | null | undefined;
  email?: string | null | undefined;
}

export interface AdminAuthLike {
  getUser: (userId: string) => Promise<AdminAuthUserLike>;
}

export interface EmailOutboxRuntime {
  run: (
    overrides?: Partial<Pick<ProcessEmailOutboxBatchOptions, "limit" | "now">>,
  ) => Promise<EmailOutboxBatchSummary>;
}

export function createFirestoreEmailOutboxRepository(
  db: AdminFirestoreLike,
): EmailOutboxRepository {
  const refsById = new Map<string, AdminDocumentReferenceLike>();

  return {
    async applyResult(result: EmailOutboxWorkerResult) {
      const ref = refsById.get(result.id);
      if (!ref) {
        throw new Error(`Outbox reference is missing for ${result.id}`);
      }

      await ref.update(toFirestorePatch(result));
    },
    async listDue(query: EmailOutboxDueQuery) {
      const snapshot = await db
        .collectionGroup("notificationOutbox")
        .where("channel", "==", "email")
        .where("status", "in", ["pending", "failed"])
        .where("sendAfter", "<=", query.now)
        .orderBy("sendAfter", "asc")
        .limit(query.limit)
        .get();

      return snapshot.docs.flatMap((snapshotDoc) => {
        const item = toEmailOutboxItem(snapshotDoc);
        if (!item) return [];

        refsById.set(item.id, snapshotDoc.ref);
        return [item];
      });
    },
  };
}

export function createAdminAuthRecipientResolver(
  auth: AdminAuthLike,
): EmailRecipientResolver {
  return {
    async resolve(userId) {
      const user = await auth.getUser(userId);
      const email = user.email?.trim();

      if (user.disabled || !email) {
        return null;
      }

      const displayName = user.displayName?.trim();

      return {
        email,
        ...(displayName ? { displayName } : {}),
      };
    },
  };
}

export function createEmailOutboxRuntime(
  options: ProcessEmailOutboxBatchOptions,
): EmailOutboxRuntime {
  return {
    run: (overrides = {}) =>
      processEmailOutboxBatch({
        ...options,
        ...overrides,
      }),
  };
}

function toEmailOutboxItem(
  snapshotDoc: AdminDocumentSnapshotLike,
): EmailOutboxItem | null {
  const data = snapshotDoc.data();
  if (!data) return null;

  const doc = toEmailOutboxDoc(data);
  if (!doc) return null;

  return {
    doc,
    id: snapshotDoc.id,
  };
}

function toEmailOutboxDoc(data: Record<string, unknown>): EmailOutboxDoc | null {
  if (data.channel !== "email") return null;

  const createdAt = toDate(data.createdAt);
  const sendAfter = toDate(data.sendAfter);
  if (!createdAt || !sendAfter) return null;
  if (!isEmailStatus(data.status)) return null;
  if (typeof data.dedupeKey !== "string") return null;
  if (typeof data.language !== "string") return null;
  if (typeof data.userId !== "string") return null;

  const base = {
    attemptCount: toOptionalNumber(data.attemptCount),
    channel: "email" as const,
    createdAt,
    dedupeKey: data.dedupeKey,
    errorMessage: toOptionalString(data.errorMessage),
    failedAt: toOptionalDate(data.failedAt),
    language: data.language,
    lastAttemptAt: toOptionalDate(data.lastAttemptAt),
    nextRetryAt: toOptionalDate(data.nextRetryAt),
    providerMessageId: toOptionalString(data.providerMessageId),
    sendAfter,
    sentAt: toOptionalDate(data.sentAt),
    status: data.status,
    userId: data.userId,
  };

  if (data.kind === "application_reminder") {
    const payload = toReminderPayload(data.payload);
    return payload
      ? compactUndefined({ ...base, kind: "application_reminder" as const, payload })
      : null;
  }

  if (data.kind === "application_daily_digest") {
    const payload = toDailyDigestPayload(data.payload);
    return payload
      ? compactUndefined({ ...base, kind: "application_daily_digest" as const, payload })
      : null;
  }

  return null;
}

function toReminderPayload(value: unknown): EmailOutboxReminderPayload | null {
  if (!isRecord(value)) return null;
  if (typeof value.actionAtMs !== "number") return null;
  if (typeof value.appId !== "string") return null;
  if (typeof value.applicationUrl !== "string") return null;
  if (typeof value.companyName !== "string") return null;
  if (typeof value.nextActionText !== "string") return null;
  if (typeof value.roleTitle !== "string") return null;

  return {
    actionAtMs: value.actionAtMs,
    appId: value.appId,
    applicationUrl: value.applicationUrl,
    companyName: value.companyName,
    nextActionText: value.nextActionText,
    roleTitle: value.roleTitle,
  };
}

function toDailyDigestPayload(value: unknown): EmailOutboxDailyDigestPayload | null {
  if (!isRecord(value)) return null;
  if (typeof value.calendarUrl !== "string") return null;
  if (typeof value.count !== "number") return null;
  if (typeof value.dateKey !== "string") return null;
  if (!Array.isArray(value.items)) return null;

  const items = value.items.map(toReminderPayload);
  if (items.some((item) => item === null)) return null;

  return {
    calendarUrl: value.calendarUrl,
    count: value.count,
    dateKey: value.dateKey,
    items: items as EmailOutboxReminderPayload[],
  };
}

function toFirestorePatch(result: EmailOutboxWorkerResult): Record<string, unknown> {
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

function isEmailStatus(value: unknown): value is EmailOutboxDoc["status"] {
  return value === "failed" || value === "pending" || value === "sent";
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
