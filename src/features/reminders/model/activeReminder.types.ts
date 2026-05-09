/**
 * ActiveReminder = a single pending reminder, denormalized from an application.
 *
 * This shape is intentionally independent of where the reminder is stored
 * (today: inline array on ApplicationDoc; tomorrow: maybe a top-level
 * `users/{uid}/reminders` collection). Consumers only depend on this type.
 */
export interface ActiveReminder {
  /** Reminder id, stable per reminder. */
  id: string;
  /** Owning application id. */
  appId: string;
  /** Pretty-name of the company for header bell rows. */
  companyName: string;
  /** Pretty-name of the role for header bell rows. */
  roleTitle: string;
  /** Date the reminder is due. */
  dueAt: Date;
  /** Free-form note authored by the user. */
  text: string;
}

export interface ActiveRemindersBuckets {
  /** dueAt <= now. */
  overdue: ActiveReminder[];
  /** dueAt > now, sorted ascending by dueAt. */
  upcoming: ActiveReminder[];
}
