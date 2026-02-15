import { getDocs, orderBy, query } from "firebase/firestore";

import { userLoopsCol } from "src/shared/api/firestoreRefs";

import type { Loop } from "../../../model";
import { mapLoopDoc } from "../../mappers/loopApi.mappers";

export async function getLoopsQuery(userId: string): Promise<Loop[]> {
  const qRef = query(
    userLoopsCol(userId),
    orderBy("createdAtTs", "desc")
  );

  const snap = await getDocs(qRef);
  return snap.docs.map(mapLoopDoc);
}
