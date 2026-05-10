import { processGoogleCalendarSyncTask } from "./googleCalendarSync.processor";
import type {
  GoogleCalendarPlanItem,
  GoogleCalendarProvider,
  GoogleCalendarSyncResult,
} from "./types";

export interface GoogleCalendarBrowserSyncRepository {
  saveResult: (
    userId: string,
    item: GoogleCalendarPlanItem,
    result: GoogleCalendarSyncResult,
    syncedAt: Date,
  ) => Promise<void>;
}

export interface SyncGoogleCalendarPlanItemsOptions {
  durationMinutes?: number | undefined;
  items: readonly GoogleCalendarPlanItem[];
  now?: Date | undefined;
  provider: GoogleCalendarProvider;
  reminderMinutes?: number | undefined;
  repository: GoogleCalendarBrowserSyncRepository;
  userId: string;
}

export interface GoogleCalendarBrowserSyncSummary {
  failed: number;
  processed: number;
  results: GoogleCalendarSyncResult[];
  synced: number;
}

export async function syncGoogleCalendarPlanItems({
  durationMinutes,
  items,
  now = new Date(),
  provider,
  reminderMinutes,
  repository,
  userId,
}: SyncGoogleCalendarPlanItemsOptions): Promise<GoogleCalendarBrowserSyncSummary> {
  const results: GoogleCalendarSyncResult[] = [];

  for (const item of items) {
    const result = await processGoogleCalendarSyncTask({
      durationMinutes,
      provider,
      reminderMinutes,
      task: {
        action: item.googleCalendarEventId ? "update" : "create",
        eventId: item.googleCalendarEventId,
        item,
      },
    });

    await repository.saveResult(userId, item, result, now);
    results.push(result);
  }

  return {
    failed: results.filter((result) => result.status === "failed").length,
    processed: results.length,
    results,
    synced: results.filter((result) => result.status === "synced").length,
  };
}
