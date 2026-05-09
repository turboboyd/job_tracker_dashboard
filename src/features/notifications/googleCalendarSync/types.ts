export type GoogleCalendarSyncAction = "create" | "delete" | "update";
export type GoogleCalendarSyncStatus = "deleted" | "failed" | "synced";
export type GoogleCalendarOutboxStatus =
  | "deleted"
  | "failed"
  | "pending"
  | "synced";

export interface GoogleCalendarPlanItem {
  actionAtMs: number;
  appId: string;
  applicationUrl: string;
  companyName: string;
  googleCalendarEventId?: string | undefined;
  location?: string | undefined;
  nextActionText: string;
  roleTitle: string;
}

export interface GoogleCalendarEventPayload {
  description: string;
  end: {
    dateTime: string;
  };
  location?: string | undefined;
  reminders: {
    overrides: {
      method: "popup";
      minutes: number;
    }[];
    useDefault: boolean;
  };
  source: {
    title: string;
    url: string;
  };
  start: {
    dateTime: string;
  };
  summary: string;
}

export interface GoogleCalendarSyncedEvent {
  htmlLink?: string | undefined;
  id: string;
}

export interface GoogleCalendarProvider {
  createEvent: (
    payload: GoogleCalendarEventPayload,
  ) => Promise<GoogleCalendarSyncedEvent>;
  deleteEvent: (eventId: string) => Promise<void>;
  updateEvent: (
    eventId: string,
    payload: GoogleCalendarEventPayload,
  ) => Promise<GoogleCalendarSyncedEvent>;
}

export interface GoogleCalendarSyncTask {
  action: GoogleCalendarSyncAction;
  eventId?: string | undefined;
  item: GoogleCalendarPlanItem;
}

export interface GoogleCalendarSyncResult {
  action: GoogleCalendarSyncAction;
  appId: string;
  errorMessage?: string | undefined;
  eventId?: string | undefined;
  htmlLink?: string | undefined;
  status: GoogleCalendarSyncStatus;
}

export interface GoogleCalendarOutboxDoc {
  action: GoogleCalendarSyncAction;
  attemptCount?: number | undefined;
  channel: "google_calendar";
  createdAt: Date;
  dedupeKey: string;
  deletedAt?: Date | undefined;
  errorMessage?: string | undefined;
  eventId?: string | undefined;
  failedAt?: Date | undefined;
  htmlLink?: string | undefined;
  kind: "application_plan";
  lastAttemptAt?: Date | undefined;
  nextRetryAt?: Date | undefined;
  payload: GoogleCalendarPlanItem;
  sendAfter: Date;
  status: GoogleCalendarOutboxStatus;
  syncedAt?: Date | undefined;
  userId: string;
}

export interface GoogleCalendarOutboxItem {
  doc: GoogleCalendarOutboxDoc;
  id: string;
}

export interface GoogleCalendarOutboxDueQuery {
  limit: number;
  now: Date;
}

export interface GoogleCalendarOutboxSyncedPatch {
  attemptCount: number;
  eventId: string;
  htmlLink?: string | undefined;
  lastAttemptAt: Date;
  status: "synced";
  syncedAt: Date;
}

export interface GoogleCalendarOutboxDeletedPatch {
  attemptCount: number;
  deletedAt: Date;
  eventId?: string | undefined;
  lastAttemptAt: Date;
  status: "deleted";
}

export interface GoogleCalendarOutboxFailedPatch {
  attemptCount: number;
  errorMessage: string;
  failedAt: Date;
  lastAttemptAt: Date;
  nextRetryAt?: Date | undefined;
  status: "failed";
}

export type GoogleCalendarOutboxWorkerPatch =
  | GoogleCalendarOutboxDeletedPatch
  | GoogleCalendarOutboxFailedPatch
  | GoogleCalendarOutboxSyncedPatch;

export interface GoogleCalendarOutboxWorkerResult {
  id: string;
  patch: GoogleCalendarOutboxWorkerPatch;
}
