import type {
  GoogleCalendarOutboxDoc,
  GoogleCalendarOutboxItem,
  GoogleCalendarPlanItem,
} from "./types";

interface BuildGoogleCalendarOutboxItemsParams {
  applicationBaseUrl: string;
  candidates: readonly GoogleCalendarPlanItem[];
  nowMs: number;
  userId: string;
}

export function buildGoogleCalendarOutboxItems({
  applicationBaseUrl,
  candidates,
  nowMs,
  userId,
}: BuildGoogleCalendarOutboxItemsParams): GoogleCalendarOutboxItem[] {
  const createdAt = new Date(nowMs);

  return candidates.map((candidate) =>
    buildGoogleCalendarOutboxItem({
      applicationBaseUrl,
      candidate,
      createdAt,
      userId,
    }),
  );
}

export function buildGoogleCalendarOutboxId(dedupeKey: string): string {
  const cleaned = `google-calendar-${dedupeKey}`
    .replace(/[^a-z0-9_-]+/gi, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `${cleaned.slice(0, 96)}-${checksum(dedupeKey)}`;
}

function buildGoogleCalendarOutboxItem({
  applicationBaseUrl,
  candidate,
  createdAt,
  userId,
}: {
  applicationBaseUrl: string;
  candidate: GoogleCalendarPlanItem;
  createdAt: Date;
  userId: string;
}): GoogleCalendarOutboxItem {
  const payload = toGoogleCalendarPayload(candidate, applicationBaseUrl);
  const dedupeKey = buildGoogleCalendarDedupeKey(payload);
  const doc: GoogleCalendarOutboxDoc = {
    action: "create",
    channel: "google_calendar",
    createdAt,
    dedupeKey,
    kind: "application_plan",
    payload,
    sendAfter: createdAt,
    status: "pending",
    userId,
  };

  return {
    doc,
    id: buildGoogleCalendarOutboxId(dedupeKey),
  };
}

function toGoogleCalendarPayload(
  candidate: GoogleCalendarPlanItem,
  applicationBaseUrl: string,
): GoogleCalendarPlanItem {
  return {
    actionAtMs: candidate.actionAtMs,
    appId: candidate.appId,
    applicationUrl:
      candidate.applicationUrl || `${applicationBaseUrl}/${candidate.appId}`,
    companyName: candidate.companyName,
    ...(candidate.location?.trim() ? { location: candidate.location.trim() } : {}),
    nextActionText: candidate.nextActionText,
    roleTitle: candidate.roleTitle,
  };
}

function buildGoogleCalendarDedupeKey(item: GoogleCalendarPlanItem): string {
  return [
    "google_calendar",
    item.appId,
    item.actionAtMs,
    item.roleTitle.trim(),
    item.companyName.trim(),
    item.nextActionText.trim(),
  ].join(":");
}

function checksum(value: string): string {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return (hash >>> 0).toString(36);
}
