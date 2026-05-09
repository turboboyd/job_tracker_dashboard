import type { Firestore } from "firebase/firestore";
import { doc, runTransaction } from "firebase/firestore";

import type { GoogleCalendarOutboxItem } from "./types";

export async function enqueueGoogleCalendarOutboxItems(
  db: Firestore,
  userId: string,
  items: readonly GoogleCalendarOutboxItem[],
): Promise<void> {
  await Promise.all(
    items.map((item) =>
      runTransaction(db, async (transaction) => {
        const ref = doc(db, "users", userId, "notificationOutbox", item.id);
        const snapshot = await transaction.get(ref);

        if (!snapshot.exists()) {
          transaction.set(ref, item.doc);
        }
      }),
    ),
  );
}
