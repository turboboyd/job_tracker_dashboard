import type { Firestore } from "firebase/firestore";
import { writeBatch } from "firebase/firestore";

import {
  attachCreatedAt,
  buildAutoGhostingEvent,
  queueHistoryEvents,
} from "./history";
import { nowTs } from "./lib/time";
import { buildGhostingPatch } from "./mutations.builders";
import { selectGhostingCandidates } from "./mutations.helpers";
import type { ApplicationRow } from "./queries.types";
import { applicationDocRef } from "./refs";

/**
 * Client-side automation: mark applications as NO_RESPONSE/GHOSTING
 * when appliedAt is older than `days` (default 30 days).
 */
export async function autoMarkGhosting(
  db: Firestore,
  userId: string,
  rows: ApplicationRow[],
  days = 30,
): Promise<number> {
  const ghostingCandidates = selectGhostingCandidates(rows, Date.now(), days);

  if (!ghostingCandidates.length) {
    return 0;
  }

  const updatedAt = nowTs();
  const batch = writeBatch(db);

  for (const { id, data } of ghostingCandidates) {
    batch.update(applicationDocRef(db, userId, id), buildGhostingPatch(updatedAt));
    queueHistoryEvents(
      batch,
      db,
      userId,
      id,
      attachCreatedAt([buildAutoGhostingEvent(data.process.status)], updatedAt),
    );
  }

  await batch.commit();
  return ghostingCandidates.length;
}
