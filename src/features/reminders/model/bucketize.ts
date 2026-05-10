import type { ActiveReminder, ActiveRemindersBuckets } from "./activeReminder.types";

/**
 * Split a flat list of reminders into overdue / upcoming buckets and sort each.
 *
 * Pure function — easy to unit test, framework-agnostic.
 */
export function bucketizeReminders(
  reminders: readonly ActiveReminder[],
  now: Date = new Date(),
): ActiveRemindersBuckets {
  const nowMs = now.getTime();
  const overdue: ActiveReminder[] = [];
  const upcoming: ActiveReminder[] = [];

  for (const r of reminders) {
    if (r.dueAt.getTime() <= nowMs) {
      overdue.push(r);
    } else {
      upcoming.push(r);
    }
  }

  // Overdue: oldest first (most urgent at top of list visually)
  overdue.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());
  // Upcoming: nearest first
  upcoming.sort((a, b) => a.dueAt.getTime() - b.dueAt.getTime());

  return { overdue, upcoming };
}
