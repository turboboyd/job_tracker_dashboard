/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Timestamp } from "firebase/firestore";

/**
 * Firestore rejects `undefined` values.
 * We keep payloads clean by stripping undefined recursively.
 *
 * Important: preserve Firestore Timestamp instances as-is.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (value === undefined || value === null) return value;
  if (value instanceof Timestamp) return value;

  if (Array.isArray(value)) {
    return value
      .filter((v) => v !== undefined)
      .map((v) => stripUndefinedDeep(v)) as unknown as T;
  }

  if (typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v === undefined) continue;
      out[k] = stripUndefinedDeep(v as unknown);
    }
    // `T` can be instantiated with a type unrelated to `Record<string, unknown>`.
    // Runtime contract: we preserve the object shape while removing `undefined`.
    return out as unknown as T;
  }

  return value;
}
