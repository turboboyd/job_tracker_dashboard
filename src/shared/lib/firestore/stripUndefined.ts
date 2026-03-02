/**
 * Removes `undefined` values from plain objects/arrays recursively.
 *
 * Important: with `exactOptionalPropertyTypes` enabled, prefer omitting optional keys
 * instead of explicitly setting them to `undefined`. This helper makes it easier to
 * produce Firestore-friendly payloads and avoid `{ key: undefined }`.
 */
export const stripUndefined = <T>(value: T): T => {
  // Arrays
  if (Array.isArray(value)) {
    const arr = value as unknown[];
    const cleaned = arr
      .map((x) => stripUndefined(x))
      .filter((x): x is Exclude<unknown, undefined> => x !== undefined);

    return cleaned as unknown as T;
  }

  // Plain objects
  if (isPlainObject(value)) {
    const obj = value as Record<string, unknown>;
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(obj)) {
      const next = stripUndefined(v);
      if (next !== undefined) out[k] = next;
    }

    return out as unknown as T;
  }

  return value;
};

const isPlainObject = (v: unknown): v is Record<string, unknown> => {
  if (v === null || typeof v !== "object") return false;
  if (Array.isArray(v)) return false;
  if (v instanceof Date) return false;
  return Object.getPrototypeOf(v) === Object.prototype;
};
