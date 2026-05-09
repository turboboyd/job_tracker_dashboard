export type EmailOutboxKind =
  | "application_daily_digest"
  | "application_reminder";

export type EmailOutboxStatus = "failed" | "pending" | "sent";

export interface ReminderEmailCandidate {
  actionAtMs: number;
  appId: string;
  companyName: string;
  key: string;
  nextActionText: string;
  roleTitle: string;
}

export interface DailyDigestEmailCandidate {
  count: number;
  dateKey: string;
  items: ReminderEmailCandidate[];
  key: string;
}

export interface EmailOutboxReminderPayload {
  actionAtMs: number;
  appId: string;
  applicationUrl: string;
  companyName: string;
  nextActionText: string;
  roleTitle: string;
}

export interface EmailOutboxDailyDigestPayload {
  calendarUrl: string;
  count: number;
  dateKey: string;
  items: EmailOutboxReminderPayload[];
}

export type EmailOutboxPayload =
  | EmailOutboxDailyDigestPayload
  | EmailOutboxReminderPayload;

interface EmailOutboxDocBase {
  attemptCount?: number | undefined;
  channel: "email";
  createdAt: Date;
  dedupeKey: string;
  errorMessage?: string | undefined;
  failedAt?: Date | undefined;
  language: string;
  lastAttemptAt?: Date | undefined;
  nextRetryAt?: Date | undefined;
  providerMessageId?: string | undefined;
  sendAfter: Date;
  sentAt?: Date | undefined;
  status: EmailOutboxStatus;
  userId: string;
}

export interface EmailOutboxReminderDoc extends EmailOutboxDocBase {
  kind: "application_reminder";
  payload: EmailOutboxReminderPayload;
}

export interface EmailOutboxDailyDigestDoc extends EmailOutboxDocBase {
  kind: "application_daily_digest";
  payload: EmailOutboxDailyDigestPayload;
}

export type EmailOutboxDoc =
  | EmailOutboxDailyDigestDoc
  | EmailOutboxReminderDoc;

export interface EmailOutboxItem {
  doc: EmailOutboxDoc;
  id: string;
}

export interface EmailOutboxSentPatch {
  attemptCount: number;
  lastAttemptAt: Date;
  providerMessageId?: string | undefined;
  sentAt: Date;
  status: "sent";
}

export interface EmailOutboxFailedPatch {
  attemptCount: number;
  errorMessage: string;
  failedAt: Date;
  lastAttemptAt: Date;
  nextRetryAt?: Date | undefined;
  status: "failed";
}

export type EmailOutboxWorkerPatch =
  | EmailOutboxFailedPatch
  | EmailOutboxSentPatch;

export interface EmailOutboxWorkerResult {
  id: string;
  patch: EmailOutboxWorkerPatch;
}

export interface EmailOutboxDueQuery {
  limit: number;
  now: Date;
}
