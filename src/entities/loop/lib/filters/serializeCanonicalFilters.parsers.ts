export const RADIUS_VALUES = [5, 10, 20, 30, 50, 100] as const;
export const POSTED_WITHIN_VALUES = [1, 3, 7, 14, 30] as const;
export const WORK_MODE_VALUES = [
  "any",
  "onsite",
  "hybrid",
  "remote",
  "remote_only",
] as const;
export const SENIORITY_VALUES = ["intern", "junior", "mid", "senior", "lead"] as const;
export const EMPLOYMENT_TYPE_VALUES = [
  "full_time",
  "part_time",
  "contract",
  "internship",
  "ausbildung",
] as const;
export const LANGUAGE_VALUES = ["any", "de", "en"] as const;

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function asNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function oneOf<T extends readonly string[]>(
  v: unknown,
  allowed: T,
): T[number] | null {
  const s = asString(v);
  if (!s) return null;
  return (allowed as readonly string[]).includes(s) ? (s as T[number]) : null;
}

function oneOfNumber<T extends readonly number[]>(
  v: unknown,
  allowed: T,
): T[number] | null {
  const n = asNumber(v);
  if (n === null) return null;
  return (allowed as readonly number[]).includes(n) ? (n as T[number]) : null;
}

function asBool(v: unknown): boolean | null {
  if (typeof v === "boolean") return v;
  const s = asString(v);
  if (!s) return null;
  const norm = s.trim().toLowerCase();
  if (norm === "true" || norm === "1" || norm === "yes") return true;
  if (norm === "false" || norm === "0" || norm === "no") return false;
  return null;
}

function firstPresentValue(
  record: Record<string, unknown>,
  keys: readonly string[],
): unknown {
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null) return value;
  }

  return undefined;
}

export function readString(
  record: Record<string, unknown>,
  keys: readonly string[],
  fallback = "",
): string {
  return asString(firstPresentValue(record, keys)) ?? fallback;
}

export function readOneOf<T extends readonly string[]>(
  record: Record<string, unknown>,
  keys: readonly string[],
  allowed: T,
  fallback: T[number],
): T[number] {
  return oneOf(firstPresentValue(record, keys), allowed) ?? fallback;
}

export function readOneOfNumber<T extends readonly number[]>(
  record: Record<string, unknown>,
  keys: readonly string[],
  allowed: T,
  fallback: T[number],
): T[number] {
  return oneOfNumber(firstPresentValue(record, keys), allowed) ?? fallback;
}

export function readBool(
  record: Record<string, unknown>,
  keys: readonly string[],
  fallback: boolean,
): boolean {
  return asBool(firstPresentValue(record, keys)) ?? fallback;
}
