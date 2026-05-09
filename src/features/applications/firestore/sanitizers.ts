import { stripUndefinedDeep } from "./lib/sanitize";
import type { ApplicationDoc, HistoryEventDoc, UserDoc } from "./types";

export function sanitizeApplicationDoc(doc: ApplicationDoc): ApplicationDoc {
  return stripUndefinedDeep(doc);
}

export function sanitizeHistoryEvent(doc: HistoryEventDoc): HistoryEventDoc {
  return stripUndefinedDeep(doc);
}

export function sanitizeHistoryEvents(docs: HistoryEventDoc[]): HistoryEventDoc[] {
  return docs.map((doc) => sanitizeHistoryEvent(doc));
}

export function sanitizeUserDoc(doc: UserDoc): UserDoc {
  return stripUndefinedDeep(doc);
}

export function sanitizeWritePatch<T extends Record<string, unknown>>(patch: T): T {
  return stripUndefinedDeep(patch);
}
