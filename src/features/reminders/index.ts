/**
 * Reminders feature — single source of truth for "active reminders" across
 * the whole product (details page, future header bell, etc.).
 *
 * Public API is intentionally narrow:
 *   - `subscribeActiveReminders` — low-level live subscription
 *   - `useActiveReminders`        — React hook around it with bucketization
 *   - types: `ActiveReminder`, `ActiveRemindersBuckets`
 *
 * Internal implementation can later switch from "extract from applications"
 * to a denormalized collection without changing this surface.
 */

export type {
  ActiveReminder,
  ActiveRemindersBuckets,
} from "./model/activeReminder.types";

export { bucketizeReminders } from "./model/bucketize";

export { subscribeActiveReminders } from "./api/subscribeActiveReminders";
export {
  completeReminderInApp,
  snoozeReminderInApp,
} from "./api/reminderActions";

export { useActiveReminders } from "./hooks/useActiveReminders";
