import {
  STATUS_KEYS,
  isStatusKey,
  type StatusKey,
} from "src/entities/application";

interface TimestampWithToMillis {
  toMillis: () => unknown;
}

interface TimestampWithSeconds {
  seconds: number;
  nanoseconds?: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function parseMs(value: unknown): number | null {
  if (value == null) return null;

  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const timestamp = Date.parse(value);
    return Number.isFinite(timestamp) ? timestamp : null;
  }

  if (isTimestampWithToMillis(value)) {
    const timestamp = value.toMillis();
    return typeof timestamp === "number" && Number.isFinite(timestamp)
      ? timestamp
      : null;
  }

  if (isTimestampWithSeconds(value)) {
    return Math.round(value.seconds * 1000);
  }

  return null;
}

export function diffDays(fromMs: number, toMs: number): number {
  return Math.round(Math.abs(toMs - fromMs) / DAY_MS);
}

export function medianDays(values: number[]): number | null {
  const sortedValues = values
    .filter((value) => Number.isFinite(value))
    .sort((left, right) => left - right);

  if (sortedValues.length === 0) return null;

  const middleIndex = Math.floor(sortedValues.length / 2);

  if (sortedValues.length % 2 === 1) {
    return sortedValues[middleIndex] ?? null;
  }

  const left = sortedValues[middleIndex - 1];
  const right = sortedValues[middleIndex];

  if (left === undefined || right === undefined) return null;

  return Math.round((left + right) / 2);
}

export function normalizeAppStatus(status: unknown): StatusKey {
  return isStatusKey(status) ? status : "SAVED";
}

export function createEmptyStatusCounts(): Record<StatusKey, number> {
  const counts = {} as Record<StatusKey, number>;

  for (const statusKey of STATUS_KEYS) {
    counts[statusKey] = 0;
  }

  return counts;
}

function isTimestampWithToMillis(value: unknown): value is TimestampWithToMillis {
  return isRecord(value) && typeof value.toMillis === "function";
}

function isTimestampWithSeconds(value: unknown): value is TimestampWithSeconds {
  return (
    isRecord(value) &&
    typeof value.seconds === "number" &&
    Number.isFinite(value.seconds)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
