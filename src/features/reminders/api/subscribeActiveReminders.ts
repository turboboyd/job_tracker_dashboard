import type { Firestore } from "firebase/firestore";

import {
  subscribeAllActiveApplications,
  type ApplicationDoc,
} from "src/features/applications";

import type { ActiveReminder } from "../model/activeReminder.types";

/**
 * Subscribe to all active reminders for a user.
 *
 * Current implementation:
 *   - Listens to all active (non-archived) applications.
 *   - Extracts reminders from each app's `process.reminders[]`.
 *
 * Why this and not a separate collection:
 *   - Reminders today live inline on `ApplicationDoc` — no schema change.
 *   - For typical loads (< 200 apps) the extract is cheap.
 *
 * Future migration path:
 *   - When a `users/{uid}/reminders` collection is introduced, swap the
 *     internal subscription. Public surface (this signature + ActiveReminder)
 *     stays the same; consumers (header bell, etc.) don't change.
 */
export function subscribeActiveReminders(
  db: Firestore,
  userId: string,
  onUpdate: (reminders: ActiveReminder[]) => void,
  onError?: (error: Error) => void,
): () => void {
  const APPLICATIONS_LIMIT = 500;

  return subscribeAllActiveApplications(
    db,
    userId,
    APPLICATIONS_LIMIT,
    (rows) => {
      const flat: ActiveReminder[] = [];
      for (const row of rows) {
        const reminders = row.data.process.reminders;
        if (!reminders || reminders.length === 0) continue;
        for (const r of reminders) {
          const dueAt = toDateOrNull(r.at);
          if (!dueAt) continue;
          flat.push({
            id: r.id,
            appId: row.id,
            companyName: row.data.job.companyName ?? "",
            roleTitle: row.data.job.roleTitle ?? "",
            dueAt,
            text: (r.text ?? "").trim(),
          });
        }
      }
      onUpdate(flat);
    },
    onError,
  );
}

function toDateOrNull(value: unknown): Date | null {
  if (!value) return null;
  try {
    const maybe = value as { toDate?: unknown };
    if (typeof maybe.toDate === "function") {
      const d = (maybe.toDate as () => Date)();
      return Number.isNaN(d.getTime()) ? null : d;
    }
    if (value instanceof Date) {
      return Number.isNaN(value.getTime()) ? null : value;
    }
    return null;
  } catch {
    return null;
  }
}

// Re-export ApplicationDoc type so consumers don't need to depend on
// `src/features/applications` directly when they only care about reminders.
export type { ApplicationDoc };
