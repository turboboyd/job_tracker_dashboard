import type { Firestore, Timestamp, writeBatch } from "firebase/firestore";
import { doc } from "firebase/firestore";

import { stripUndefinedDeep } from "./lib/sanitize";
import { historyColRef, historyDocRef } from "./refs";
import type { HistoryEventDoc } from "./types";

export function attachCreatedAt(events: HistoryEventDoc[], t: Timestamp) {
  return events.map((e) => ({ ...e, createdAt: e.createdAt ?? t }));
}

export function queueHistoryEvents(
  batch: ReturnType<typeof writeBatch>,
  db: Firestore,
  userId: string,
  appId: string,
  events: HistoryEventDoc[],
) {
  for (const ev of events) {
    const hId = doc(historyColRef(db, userId, appId)).id;
    const hRef = historyDocRef(db, userId, appId, hId);
    batch.set(hRef, stripUndefinedDeep(ev));
  }
}
