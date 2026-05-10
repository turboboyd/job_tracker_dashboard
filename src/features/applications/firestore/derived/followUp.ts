import type { Timestamp } from "firebase/firestore";

import type { ApplicationDoc } from "../documents.types";
import { FOLLOW_UP_DAYS } from "../lib/constants";
import { addDays, daysBetween } from "../lib/time";

/**
 * Follow-up system (client-side):
 * needsFollowUp when:
 * - status is in active pipeline
 * - and last contact/status change is >= 7 days ago
 * - and last follow-up is not recent
 */
export function computeFollowUp(
  app: ApplicationDoc,
  t: Timestamp,
): {
  needsFollowUp: boolean;
  followUpDueAt?: Timestamp;
  followUpLevel: number;
} {
  const status = app.process.status;
  const active = [
    "APPLIED",
    "VIEWED",
    "INTERVIEW_1",
    "INTERVIEW_2",
    "TEST_TASK",
  ].includes(status);

  if (!active) {
    return {
      needsFollowUp: false,
      followUpLevel: app.process.followUpLevel ?? 0,
    };
  }

  const ref = app.process.lastContactAt ?? app.process.lastStatusChangeAt;
  const followUpRef = app.process.lastFollowUpAt;

  const daysSinceRef = daysBetween(ref, t);
  const daysSinceFollow = followUpRef ? daysBetween(followUpRef, t) : 999;

  const dueAt = addDays(ref, FOLLOW_UP_DAYS);
  const due = t.toMillis() >= dueAt.toMillis();

  const needs =
    daysSinceRef >= FOLLOW_UP_DAYS &&
    daysSinceFollow >= FOLLOW_UP_DAYS &&
    due;

  return {
    needsFollowUp: needs,
    ...(needs ? { followUpDueAt: dueAt } : {}),
    followUpLevel: app.process.followUpLevel ?? 0,
  };
}
