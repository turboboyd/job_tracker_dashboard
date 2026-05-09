import type { Firestore } from "firebase/firestore";

import {
  addComment,
  getApplication,
  setReminders,
} from "src/features/applications";

/**
 * Read-modify-write helpers operating on the reminders array of a single
 * application.
 *
 * Used by surfaces that don't own the application's reminders state (e.g.
 * the global header bell). Each function:
 *   1. Loads the current application (one read)
 *   2. Mutates the reminders array
 *   3. Persists the new array via `setReminders`
 *   4. Optionally appends a history comment
 *
 * Safe to call concurrently for different (appId, reminderId) pairs; not
 * safe for the same reminder under heavy concurrency (last write wins).
 */

function reminderEntryToDateInput(
  entry: { id: string; at: { toDate?: () => Date } | unknown; text?: string },
): { id: string; at: Date; text: string } | null {
  const at = entry.at as { toDate?: () => Date };
  if (!at || typeof at.toDate !== "function") return null;
  const date = at.toDate();
  return Number.isNaN(date.getTime())
    ? null
    : { id: entry.id, at: date, text: entry.text ?? "" };
}

/**
 * Remove a reminder and log a "completed" comment to history.
 */
export async function completeReminderInApp(
  db: Firestore,
  userId: string,
  appId: string,
  reminderId: string,
  doneCommentLabel: string,
): Promise<void> {
  const app = await getApplication(db, userId, appId);
  if (!app) return;

  const current = app.process.reminders ?? [];
  const removed = current.find((r) => r.id === reminderId);
  const next = current
    .filter((r) => r.id !== reminderId)
    .map(reminderEntryToDateInput)
    .filter((e): e is { id: string; at: Date; text: string } => e !== null);

  await setReminders(db, userId, appId, next);

  const note = removed?.text?.trim() ? ` — ${removed.text.trim()}` : "";
  await addComment(db, userId, appId, { text: `${doneCommentLabel}${note}` });
}

/**
 * Update a reminder's date/time without touching its id or text.
 */
export async function snoozeReminderInApp(
  db: Firestore,
  userId: string,
  appId: string,
  reminderId: string,
  target: Date,
): Promise<void> {
  if (Number.isNaN(target.getTime())) return;
  const app = await getApplication(db, userId, appId);
  if (!app) return;

  const current = app.process.reminders ?? [];
  const next = current
    .map((r) =>
      r.id === reminderId
        ? { id: r.id, at: target, text: r.text ?? "" }
        : reminderEntryToDateInput(r),
    )
    .filter((e): e is { id: string; at: Date; text: string } => e !== null);

  await setReminders(db, userId, appId, next);
}
