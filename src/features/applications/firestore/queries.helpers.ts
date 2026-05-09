import type { DocumentData, QueryDocumentSnapshot } from "firebase/firestore";

import type { ApplicationDoc, HistoryEventDoc } from "./documents.types";
import type { ApplicationHistoryRow, ApplicationRow } from "./queries.types";

interface TimestampMillisLike {
  toMillis: () => number;
}

interface TimestampSecondsLike {
  nanoseconds?: number;
  seconds: number;
}

const QUERY_FETCH_MULTIPLIER = 3;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimestampMillisLike(value: unknown): value is TimestampMillisLike {
  return (
    isObject(value) &&
    typeof (value as unknown as TimestampMillisLike).toMillis === "function"
  );
}

function isTimestampSecondsLike(value: unknown): value is TimestampSecondsLike {
  return (
    isObject(value) &&
    typeof (value as unknown as TimestampSecondsLike).seconds === "number"
  );
}

export function toMs(value: unknown): number {
  if (value == null) {
    return 0;
  }

  if (typeof value === "number") {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (isTimestampMillisLike(value)) {
    return value.toMillis();
  }

  if (isTimestampSecondsLike(value)) {
    return value.seconds * 1000;
  }

  return 0;
}

export function expandQueryTake(take: number): number {
  return take * QUERY_FETCH_MULTIPLIER;
}

export function mapApplicationRow(
  documentSnapshot: QueryDocumentSnapshot<DocumentData>,
): ApplicationRow {
  return {
    data: documentSnapshot.data() as ApplicationDoc,
    id: documentSnapshot.id,
  };
}

export function mapHistoryRow(
  documentSnapshot: QueryDocumentSnapshot<DocumentData>,
): ApplicationHistoryRow {
  return {
    data: documentSnapshot.data() as HistoryEventDoc,
    id: documentSnapshot.id,
  };
}

export function isActiveApplicationRow(row: ApplicationRow): boolean {
  return !row.data.archived;
}

export function sortApplicationRowsByLastStatusChangeDesc(
  rows: ApplicationRow[],
): ApplicationRow[] {
  return [...rows].sort(
    (left, right) =>
      toMs(right.data.process.lastStatusChangeAt) - toMs(left.data.process.lastStatusChangeAt),
  );
}

export function sortApplicationRowsByFollowUpDueAsc(
  rows: ApplicationRow[],
): ApplicationRow[] {
  return [...rows].sort(
    (left, right) =>
      toMs(left.data.process.followUpDueAt) - toMs(right.data.process.followUpDueAt),
  );
}

export function takeRows<T>(rows: T[], take: number): T[] {
  return rows.slice(0, take);
}
