import type { ApplicationDoc } from "./firestore/types";

/**
 * A single application row: the Firestore document plus its id.
 *
 * Lives in the applications feature (not a page) so that other slices — e.g.
 * the loops feature deriving per-loop stat counters — can consume the row shape
 * and the due/follow-up predicates without reaching into the ApplicationsPage.
 */
export interface AppRow {
  data: ApplicationDoc;
  id: string;
}

export function isApplicationDueToday(row: AppRow, now: Date = new Date()): boolean {
  const nextActionAt = row.data.process.nextActionAt?.toDate?.();
  if (!nextActionAt) return false;

  return isSameLocalDate(nextActionAt, now);
}

export function isApplicationFollowUpDue(row: AppRow, now: Date = new Date()): boolean {
  if (row.data.archived) return false;
  if (row.data.process.needsFollowUp !== true) return false;

  const dueAt = row.data.process.followUpDueAt?.toDate?.();
  if (!dueAt) return true;

  return dueAt.getTime() <= now.getTime();
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}
