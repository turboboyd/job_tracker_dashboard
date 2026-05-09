import type { Firestore } from "firebase/firestore";
import {
  doc,
  runTransaction,
} from "firebase/firestore";

import type { EmailOutboxItem } from "./types";

export async function enqueueEmailOutboxItems(
  db: Firestore,
  userId: string,
  items: readonly EmailOutboxItem[],
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
