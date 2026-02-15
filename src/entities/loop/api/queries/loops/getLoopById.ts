import { getDoc } from "firebase/firestore";

import { userLoopDoc } from "src/shared/api/firestoreRefs";

import type { Loop } from "../../../model";
import { mapLoopSnap } from "../../mappers/loopApi.mappers";

export async function getLoopByIdQuery(uid: string, loopId: string): Promise<Loop | null> {
  const snap = await getDoc(userLoopDoc(uid, loopId));
  return mapLoopSnap(snap);
}
