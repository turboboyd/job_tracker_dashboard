type PlainObject = Record<string, unknown>;

function isPlainObject(v: unknown): v is PlainObject {
  return !!v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date);
}

/**
 * Deeply removes keys with value `undefined`.
 * Keeps Firestore Timestamp-like objects (anything with a `toDate` method) intact.
 */
export function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .map((x) => stripUndefined(x))
      .filter((x) => x !== undefined) as unknown as T;
  }

  if (isPlainObject(value) && !("toDate" in value)) {
    const out: PlainObject = {};
    for (const [k, v] of Object.entries(value)) {
      if (v === undefined) continue;
      out[k] = stripUndefined(v);
    }
    return out as unknown as T;
  }

  return value;
}