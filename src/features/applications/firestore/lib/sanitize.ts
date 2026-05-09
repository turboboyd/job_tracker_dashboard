import { Timestamp } from "firebase/firestore";

import { isPlainObject } from "./plainObject";

/**
 * Firestore rejects `undefined` values.
 * We keep payloads clean by stripping undefined recursively.
 *
 * Important: preserve Firestore Timestamp instances as-is.
 * Also preserve other non-plain objects (for example Date) instead of flattening them.
 */
function stripUndefinedDeepUnknown(value: unknown): unknown {
  if (value === undefined || value === null) {
    return value;
  }

  if (value instanceof Timestamp) {
    return value;
  }

  if (Array.isArray(value)) {
    const nextArray: unknown[] = [];

    for (const item of value) {
      if (item !== undefined) {
        nextArray.push(stripUndefinedDeepUnknown(item));
      }
    }

    return nextArray;
  }

  if (isPlainObject(value)) {
    const nextObject: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      if (nestedValue !== undefined) {
        nextObject[key] = stripUndefinedDeepUnknown(nestedValue);
      }
    }

    return nextObject;
  }

  return value;
}

export function stripUndefinedDeep<T>(value: T): T {
  return stripUndefinedDeepUnknown(value) as T;
}
