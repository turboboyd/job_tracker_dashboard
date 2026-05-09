import type {
  GoogleCalendarConnectionDoc,
  GoogleCalendarConnectionPatch,
  GoogleCalendarConnectionRepository,
} from "./googleCalendarConnection.runtime";

interface AdminDocumentReferenceLike {
  get: () => Promise<AdminDocumentSnapshotLike>;
  set: (data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
  update: (data: Record<string, unknown>) => Promise<void>;
}

interface AdminDocumentSnapshotLike {
  data: () => Record<string, unknown> | undefined;
}

interface AdminCollectionLike {
  doc: (docId: string) => AdminDocumentReferenceLike;
}

export interface AdminGoogleCalendarConnectionFirestoreLike {
  collection: (collectionId: string) => AdminCollectionLike;
}

export function createFirestoreGoogleCalendarConnectionRepository(
  db: AdminGoogleCalendarConnectionFirestoreLike,
): GoogleCalendarConnectionRepository {
  return {
    async get(userId) {
      const snapshot = await connectionRef(db, userId).get();
      const data = snapshot.data();

      return data ? toConnectionDoc(data) : null;
    },
    async save(connection) {
      await connectionRef(db, connection.userId).set(
        compactUndefinedRecord(connection),
        { merge: true },
      );
    },
    async update(userId, patch) {
      await connectionRef(db, userId).update(compactUndefinedRecord(patch));
    },
  };
}

function connectionRef(
  db: AdminGoogleCalendarConnectionFirestoreLike,
  userId: string,
): AdminDocumentReferenceLike {
  return db.collection("googleCalendarConnections").doc(userId);
}

function toConnectionDoc(
  data: Record<string, unknown>,
): GoogleCalendarConnectionDoc | null {
  const connectedAt = toDate(data.connectedAt);
  const expiresAt = toDate(data.expiresAt);
  const updatedAt = toDate(data.updatedAt);
  if (!connectedAt || !expiresAt || !updatedAt) return null;
  if (!isConnectionStatus(data.status)) return null;
  if (typeof data.accessToken !== "string") return null;
  if (typeof data.calendarId !== "string") return null;
  if (typeof data.refreshToken !== "string") return null;
  if (typeof data.tokenType !== "string") return null;
  if (typeof data.userId !== "string") return null;

  return compactUndefinedRecord({
    accessToken: data.accessToken,
    calendarId: data.calendarId,
    connectedAt,
    expiresAt,
    refreshToken: data.refreshToken,
    scope: toOptionalString(data.scope),
    status: data.status,
    tokenType: data.tokenType,
    updatedAt,
    userId: data.userId,
  }) as unknown as GoogleCalendarConnectionDoc;
}

function compactUndefinedRecord(value: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, entry]) => entry !== undefined,
    ),
  );
}

function toDate(value: unknown): Date | null {
  const primitiveDate = toPrimitiveDate(value);
  if (primitiveDate) return primitiveDate;

  return toTimestampLikeDate(value);
}

function toPrimitiveDate(value: unknown): Date | null {
  if (value instanceof Date) return toValidDate(value);
  if (typeof value === "number") return toValidDate(new Date(value));
  if (typeof value === "string") return toValidDate(new Date(value));

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

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function isConnectionStatus(
  value: unknown,
): value is GoogleCalendarConnectionDoc["status"] {
  return value === "connected" || value === "revoked";
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

export type { GoogleCalendarConnectionPatch };
