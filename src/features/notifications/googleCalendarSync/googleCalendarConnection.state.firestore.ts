import type {
  GoogleCalendarOAuthStateDoc,
  GoogleCalendarOAuthStateRepository,
} from "./googleCalendarConnection.handlers";

interface AdminDocumentReferenceLike {
  delete: () => Promise<void>;
  get: () => Promise<AdminDocumentSnapshotLike>;
  set: (data: Record<string, unknown>) => Promise<void>;
}

interface AdminDocumentSnapshotLike {
  data: () => Record<string, unknown> | undefined;
}

interface AdminCollectionLike {
  doc: (docId: string) => AdminDocumentReferenceLike;
}

export interface AdminGoogleCalendarStateFirestoreLike {
  collection: (collectionId: string) => AdminCollectionLike;
}

export function createFirestoreGoogleCalendarOAuthStateRepository(
  db: AdminGoogleCalendarStateFirestoreLike,
): GoogleCalendarOAuthStateRepository {
  return {
    async consume(state) {
      const ref = stateRef(db, state);
      const snapshot = await ref.get();
      const data = snapshot.data();

      if (!data) return null;

      await ref.delete();
      return toStateDoc(data);
    },
    async save(state) {
      await stateRef(db, state.state).set(compactUndefinedRecord(state));
    },
  };
}

function stateRef(
  db: AdminGoogleCalendarStateFirestoreLike,
  state: string,
): AdminDocumentReferenceLike {
  return db.collection("googleCalendarOAuthStates").doc(state);
}

function toStateDoc(
  data: Record<string, unknown>,
): GoogleCalendarOAuthStateDoc | null {
  const createdAt = toDate(data.createdAt);
  const expiresAt = toDate(data.expiresAt);
  if (!createdAt || !expiresAt) return null;
  if (typeof data.returnTo !== "string") return null;
  if (typeof data.state !== "string") return null;
  if (typeof data.userId !== "string") return null;

  return compactUndefinedRecord({
    createdAt,
    expiresAt,
    loginHint: toOptionalString(data.loginHint),
    returnTo: data.returnTo,
    state: data.state,
    userId: data.userId,
  }) as unknown as GoogleCalendarOAuthStateDoc;
}

function compactUndefinedRecord(value: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined),
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isToDateLike(value: unknown): value is { toDate: () => unknown } {
  return isRecord(value) && typeof value.toDate === "function";
}

function isToMillisLike(value: unknown): value is { toMillis: () => number } {
  return isRecord(value) && typeof value.toMillis === "function";
}
