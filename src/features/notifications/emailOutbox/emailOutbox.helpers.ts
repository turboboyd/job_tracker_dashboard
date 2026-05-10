import type {
  DailyDigestEmailCandidate,
  EmailOutboxDoc,
  EmailOutboxItem,
  EmailOutboxReminderPayload,
  ReminderEmailCandidate,
} from "./types";

interface BuildReminderEmailOutboxItemsParams {
  applicationBaseUrl: string;
  calendarUrl: string;
  candidates: readonly ReminderEmailCandidate[];
  digestCandidate: DailyDigestEmailCandidate | null;
  language: string;
  nowMs: number;
  userId: string;
}

export function buildReminderEmailOutboxItems({
  applicationBaseUrl,
  calendarUrl,
  candidates,
  digestCandidate,
  language,
  nowMs,
  userId,
}: BuildReminderEmailOutboxItemsParams): EmailOutboxItem[] {
  const createdAt = new Date(nowMs);
  const reminderItems = candidates.map((candidate) =>
    buildReminderEmailOutboxItem({
      applicationBaseUrl,
      candidate,
      createdAt,
      language,
      userId,
    }),
  );

  return digestCandidate
    ? [
        ...reminderItems,
        buildDailyDigestEmailOutboxItem({
          applicationBaseUrl,
          calendarUrl,
          candidate: digestCandidate,
          createdAt,
          language,
          userId,
        }),
      ]
    : reminderItems;
}

export function buildEmailOutboxId(kind: string, dedupeKey: string): string {
  const cleaned = `${kind}-${dedupeKey}`
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${cleaned.slice(0, 96)}-${checksum(dedupeKey)}`;
}

function buildReminderEmailOutboxItem({
  applicationBaseUrl,
  candidate,
  createdAt,
  language,
  userId,
}: {
  applicationBaseUrl: string;
  candidate: ReminderEmailCandidate;
  createdAt: Date;
  language: string;
  userId: string;
}): EmailOutboxItem {
  const dedupeKey = `email:${candidate.key}`;
  const doc: EmailOutboxDoc = {
    channel: "email",
    createdAt,
    dedupeKey,
    kind: "application_reminder",
    language,
    payload: toReminderPayload(candidate, applicationBaseUrl),
    sendAfter: createdAt,
    status: "pending",
    userId,
  };

  return {
    doc,
    id: buildEmailOutboxId(doc.kind, dedupeKey),
  };
}

function buildDailyDigestEmailOutboxItem({
  applicationBaseUrl,
  calendarUrl,
  candidate,
  createdAt,
  language,
  userId,
}: {
  applicationBaseUrl: string;
  calendarUrl: string;
  candidate: DailyDigestEmailCandidate;
  createdAt: Date;
  language: string;
  userId: string;
}): EmailOutboxItem {
  const dedupeKey = `email:${candidate.key}`;
  const doc: EmailOutboxDoc = {
    channel: "email",
    createdAt,
    dedupeKey,
    kind: "application_daily_digest",
    language,
    payload: {
      calendarUrl,
      count: candidate.count,
      dateKey: candidate.dateKey,
      items: candidate.items.map((item) =>
        toReminderPayload(item, applicationBaseUrl),
      ),
    },
    sendAfter: createdAt,
    status: "pending",
    userId,
  };

  return {
    doc,
    id: buildEmailOutboxId(doc.kind, dedupeKey),
  };
}

function toReminderPayload(
  candidate: ReminderEmailCandidate,
  applicationBaseUrl: string,
): EmailOutboxReminderPayload {
  return {
    actionAtMs: candidate.actionAtMs,
    appId: candidate.appId,
    applicationUrl: `${applicationBaseUrl}/${candidate.appId}`,
    companyName: candidate.companyName,
    nextActionText: candidate.nextActionText,
    roleTitle: candidate.roleTitle,
  };
}

function checksum(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
