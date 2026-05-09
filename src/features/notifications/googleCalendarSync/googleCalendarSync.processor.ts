import { buildGoogleCalendarEventPayload } from "./googleCalendarSync.helpers";
import type {
  GoogleCalendarProvider,
  GoogleCalendarSyncResult,
  GoogleCalendarSyncTask,
} from "./types";

interface ProcessGoogleCalendarSyncTaskOptions {
  durationMinutes?: number | undefined;
  provider: GoogleCalendarProvider;
  reminderMinutes?: number | undefined;
  task: GoogleCalendarSyncTask;
}

export async function processGoogleCalendarSyncTask({
  durationMinutes,
  provider,
  reminderMinutes,
  task,
}: ProcessGoogleCalendarSyncTaskOptions): Promise<GoogleCalendarSyncResult> {
  try {
    if (task.action === "delete") {
      return await deleteGoogleCalendarEvent(provider, task);
    }

    const payload = buildGoogleCalendarEventPayload({
      durationMinutes,
      item: task.item,
      reminderMinutes,
    });
    const event =
      task.action === "update" && task.eventId
        ? await provider.updateEvent(task.eventId, payload)
        : await provider.createEvent(payload);

    return {
      action: task.action,
      appId: task.item.appId,
      eventId: event.id,
      htmlLink: event.htmlLink,
      status: "synced",
    };
  } catch (error) {
    return {
      action: task.action,
      appId: task.item.appId,
      errorMessage: getErrorMessage(error),
      eventId: task.eventId,
      status: "failed",
    };
  }
}

async function deleteGoogleCalendarEvent(
  provider: GoogleCalendarProvider,
  task: GoogleCalendarSyncTask,
): Promise<GoogleCalendarSyncResult> {
  if (!task.eventId) {
    return {
      action: task.action,
      appId: task.item.appId,
      status: "deleted",
    };
  }

  await provider.deleteEvent(task.eventId);

  return {
    action: task.action,
    appId: task.item.appId,
    eventId: task.eventId,
    status: "deleted",
  };
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Unknown Google Calendar sync error";
}
