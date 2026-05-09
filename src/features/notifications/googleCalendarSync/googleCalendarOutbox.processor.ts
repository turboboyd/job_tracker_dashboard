import { processGoogleCalendarSyncTask } from "./googleCalendarSync.processor";
import type {
  GoogleCalendarOutboxDueQuery,
  GoogleCalendarOutboxItem,
  GoogleCalendarOutboxWorkerResult,
  GoogleCalendarProvider,
  GoogleCalendarSyncedEvent,
} from "./types";

const DEFAULT_BATCH_LIMIT = 20;

export interface GoogleCalendarOutboxRepository {
  applyResult: (result: GoogleCalendarOutboxWorkerResult) => Promise<void>;
  findLatestSyncedEvent: (
    userId: string,
    appId: string,
  ) => Promise<GoogleCalendarSyncedEvent | null>;
  listDue: (query: GoogleCalendarOutboxDueQuery) => Promise<GoogleCalendarOutboxItem[]>;
}

export interface GoogleCalendarProviderResolver {
  resolve: (userId: string) => Promise<GoogleCalendarProvider | null>;
}

export interface ProcessGoogleCalendarOutboxBatchOptions {
  durationMinutes?: number | undefined;
  limit?: number | undefined;
  now?: Date | undefined;
  providerResolver: GoogleCalendarProviderResolver;
  reminderMinutes?: number | undefined;
  repository: GoogleCalendarOutboxRepository;
  retryDelayMinutes?: number | undefined;
}

export interface GoogleCalendarOutboxBatchSummary {
  deleted: number;
  failed: number;
  processed: number;
  results: GoogleCalendarOutboxWorkerResult[];
  scanned: number;
  skipped: number;
  synced: number;
}

export async function processGoogleCalendarOutboxBatch(
  options: ProcessGoogleCalendarOutboxBatchOptions,
): Promise<GoogleCalendarOutboxBatchSummary> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? DEFAULT_BATCH_LIMIT;
  const items = await options.repository.listDue({ limit, now });
  const syncedEvents = new Map<string, GoogleCalendarSyncedEvent>();
  const results: GoogleCalendarOutboxWorkerResult[] = [];
  let skipped = 0;

  for (const item of items) {
    if (!shouldProcessGoogleCalendarOutboxItem(item, now)) {
      skipped += 1;
      continue;
    }

    const provider = await options.providerResolver.resolve(item.doc.userId);
    const result = provider
      ? await processGoogleCalendarOutboxItem(item, {
          durationMinutes: options.durationMinutes,
          existingEvent: await resolveExistingEvent(
            item,
            options.repository,
            syncedEvents,
          ),
          now,
          provider,
          reminderMinutes: options.reminderMinutes,
          retryDelayMinutes: options.retryDelayMinutes,
        })
      : buildMissingProviderResult(item, now);

    await options.repository.applyResult(result);
    rememberSyncedEvent(item, result, syncedEvents);
    results.push(result);
  }

  return {
    deleted: results.filter((result) => result.patch.status === "deleted").length,
    failed: results.filter((result) => result.patch.status === "failed").length,
    processed: results.length,
    results,
    scanned: items.length,
    skipped,
    synced: results.filter((result) => result.patch.status === "synced").length,
  };
}

export async function processGoogleCalendarOutboxItem(
  item: GoogleCalendarOutboxItem,
  options: {
    durationMinutes?: number | undefined;
    existingEvent?: GoogleCalendarSyncedEvent | null | undefined;
    now: Date;
    provider: GoogleCalendarProvider;
    reminderMinutes?: number | undefined;
    retryDelayMinutes?: number | undefined;
  },
): Promise<GoogleCalendarOutboxWorkerResult> {
  const eventId = item.doc.eventId ?? options.existingEvent?.id;
  const taskAction =
    item.doc.action === "create" && eventId ? "update" : item.doc.action;
  const result = await processGoogleCalendarSyncTask({
    durationMinutes: options.durationMinutes,
    provider: options.provider,
    reminderMinutes: options.reminderMinutes,
    task: {
      action: taskAction,
      eventId,
      item: item.doc.payload,
    },
  });
  const attemptCount = (item.doc.attemptCount ?? 0) + 1;

  if (result.status === "synced" && result.eventId) {
    return {
      id: item.id,
      patch: {
        attemptCount,
        eventId: result.eventId,
        htmlLink: result.htmlLink,
        lastAttemptAt: options.now,
        status: "synced",
        syncedAt: options.now,
      },
    };
  }

  if (result.status === "deleted") {
    return {
      id: item.id,
      patch: {
        attemptCount,
        deletedAt: options.now,
        eventId: result.eventId,
        lastAttemptAt: options.now,
        status: "deleted",
      },
    };
  }

  return buildFailedResult(
    item,
    options.now,
    result.errorMessage ?? "Google Calendar sync failed",
    options.retryDelayMinutes,
  );
}

export function shouldProcessGoogleCalendarOutboxItem(
  item: GoogleCalendarOutboxItem,
  now: Date,
): boolean {
  if (item.doc.status === "synced" || item.doc.status === "deleted") {
    return false;
  }

  const dueAt =
    item.doc.status === "failed" && item.doc.nextRetryAt
      ? item.doc.nextRetryAt
      : item.doc.sendAfter;

  return dueAt.getTime() <= now.getTime();
}

async function resolveExistingEvent(
  item: GoogleCalendarOutboxItem,
  repository: GoogleCalendarOutboxRepository,
  syncedEvents: Map<string, GoogleCalendarSyncedEvent>,
): Promise<GoogleCalendarSyncedEvent | null> {
  const key = buildApplicationKey(item.doc.userId, item.doc.payload.appId);
  const cached = syncedEvents.get(key);
  if (cached) return cached;

  const existing = await repository.findLatestSyncedEvent(
    item.doc.userId,
    item.doc.payload.appId,
  );
  if (existing) {
    syncedEvents.set(key, existing);
  }

  return existing;
}

function rememberSyncedEvent(
  item: GoogleCalendarOutboxItem,
  result: GoogleCalendarOutboxWorkerResult,
  syncedEvents: Map<string, GoogleCalendarSyncedEvent>,
): void {
  if (result.patch.status !== "synced") return;

  syncedEvents.set(buildApplicationKey(item.doc.userId, item.doc.payload.appId), {
    id: result.patch.eventId,
    htmlLink: result.patch.htmlLink,
  });
}

function buildMissingProviderResult(
  item: GoogleCalendarOutboxItem,
  now: Date,
): GoogleCalendarOutboxWorkerResult {
  return buildFailedResult(
    item,
    now,
    "Google Calendar account is not connected",
  );
}

function buildFailedResult(
  item: GoogleCalendarOutboxItem,
  now: Date,
  errorMessage: string,
  retryDelayMinutes = 30,
): GoogleCalendarOutboxWorkerResult {
  return {
    id: item.id,
    patch: {
      attemptCount: (item.doc.attemptCount ?? 0) + 1,
      errorMessage,
      failedAt: now,
      lastAttemptAt: now,
      nextRetryAt: new Date(now.getTime() + retryDelayMinutes * 60 * 1000),
      status: "failed",
    },
  };
}

function buildApplicationKey(userId: string, appId: string): string {
  return `${userId}:${appId}`;
}
