import type { Firestore } from "firebase/firestore";
import { Timestamp, deleteField, doc, updateDoc } from "firebase/firestore";

import type { GoogleCalendarBrowserSyncRepository } from "./googleCalendarBrowserSync";
import type {
  GoogleCalendarPlanItem,
  GoogleCalendarSyncResult,
} from "./types";

export function createFirestoreGoogleCalendarBrowserSyncRepository(
  db: Firestore,
): GoogleCalendarBrowserSyncRepository {
  return {
    saveResult: (userId, item, result, syncedAt) =>
      saveGoogleCalendarBrowserSyncResult(db, userId, item, result, syncedAt),
  };
}

export async function saveGoogleCalendarBrowserSyncResult(
  db: Firestore,
  userId: string,
  item: GoogleCalendarPlanItem,
  result: GoogleCalendarSyncResult,
  syncedAt: Date,
): Promise<void> {
  const ref = doc(db, "users", userId, "applications", item.appId);
  const syncedAtTimestamp = Timestamp.fromDate(syncedAt);

  if (result.status === "synced" && result.eventId) {
    await updateDoc(ref, {
      "integrations.googleCalendar.actionAtMs": item.actionAtMs,
      "integrations.googleCalendar.errorMessage": deleteField(),
      "integrations.googleCalendar.eventId": result.eventId,
      "integrations.googleCalendar.htmlLink": result.htmlLink ?? "",
      "integrations.googleCalendar.lastErrorAt": deleteField(),
      "integrations.googleCalendar.lastSyncedAt": syncedAtTimestamp,
      updatedAt: syncedAtTimestamp,
    });
    return;
  }

  await updateDoc(ref, {
    "integrations.googleCalendar.errorMessage":
      result.errorMessage ?? "Google Calendar sync failed",
    "integrations.googleCalendar.lastErrorAt": syncedAtTimestamp,
    updatedAt: syncedAtTimestamp,
  });
}
