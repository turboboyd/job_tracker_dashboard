/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-return */
import type { DotPatch } from "../types";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  if (!v || typeof v !== "object") return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

/**
 * Deep clone that PRESERVES class instances (e.g. Firestore Timestamp).
 * We only deep-clone arrays and plain objects.
 */
function deepClonePreserve<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => deepClonePreserve(v)) as unknown as T;
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = deepClonePreserve(v);
    return out as T;
  }
  return value;
}

export function applyDotPatch<T extends Record<string, unknown>>(
  base: T,
  patch: DotPatch,
): T {
  // IMPORTANT: do not JSON-clone here.
  // Firestore Timestamp has methods (toMillis, toDate, etc.). JSON cloning turns it into a plain object
  // and later code (computeFollowUp/daysBetween) will crash with "a.toMillis is not a function".
  const out = deepClonePreserve(base) as unknown as Record<string, unknown>;

  for (const [k, v] of Object.entries(patch)) {
    if (!k.includes(".")) {
      out[k] = v;
      continue;
    }
    const parts = k.split(".");
    let cur: Record<string, unknown> = out;
    for (let i = 0; i < parts.length - 1; i += 1) {
      const p = parts[i];
      if (p === undefined) continue;
      const next = cur[p];
      if (!next || typeof next !== "object") cur[p] = {};
      cur = cur[p] as Record<string, unknown>;
    }
    const last = parts[parts.length - 1];
    if (last !== undefined) cur[last] = v;
  }
  return out as T;
}
