import type { DotPatch } from "../patch.types";

import { isPlainObject } from "./plainObject";

/**
 * Deep clone that PRESERVES class instances (e.g. Firestore Timestamp).
 * We only deep-clone arrays and plain objects.
 */
function deepClonePreserveUnknown(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => deepClonePreserveUnknown(item));
  }

  if (isPlainObject(value)) {
    const result: Record<string, unknown> = {};

    for (const [key, nestedValue] of Object.entries(value)) {
      result[key] = deepClonePreserveUnknown(nestedValue);
    }

    return result;
  }

  return value;
}

function getOrCreateNestedRecord(
  target: Record<string, unknown>,
  key: string,
): Record<string, unknown> {
  const nextValue = target[key];

  if (isPlainObject(nextValue)) {
    return nextValue;
  }

  const nextRecord: Record<string, unknown> = {};
  target[key] = nextRecord;
  return nextRecord;
}

export function applyDotPatch<T extends Record<string, unknown>>(
  base: T,
  patch: DotPatch,
): T {
  // IMPORTANT: do not JSON-clone here.
  // Firestore Timestamp has methods (toMillis, toDate, etc.). JSON cloning turns it into a plain object
  // and later code (computeFollowUp/daysBetween) will crash with "a.toMillis is not a function".
  const result = deepClonePreserveUnknown(base) as T;
  const mutableResult = result as Record<string, unknown>;

  for (const [path, value] of Object.entries(patch)) {
    if (!path.includes(".")) {
      mutableResult[path] = value;
      continue;
    }

    const pathParts = path.split(".");
    let currentRecord = mutableResult;

    for (const segment of pathParts.slice(0, -1)) {
      currentRecord = getOrCreateNestedRecord(currentRecord, segment);
    }

    const lastSegment = pathParts.at(-1);
    if (lastSegment) {
      currentRecord[lastSegment] = value;
    }
  }

  return result;
}
