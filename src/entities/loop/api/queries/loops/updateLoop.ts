import { updateDoc } from "firebase/firestore";

import { userLoopDoc } from "src/shared/api/firestoreRefs";

import type { UpdateLoopInput } from "../../loopApi.types";
import {
  cleanLoopPatch,
  type LoopFirestoreCreate,
} from "../../mappers/loopApi.mappers";

export async function updateLoopQuery(uid: string, input: UpdateLoopInput): Promise<void> {
  const patch = cleanLoopPatch(input);
  await updateDoc(userLoopDoc<LoopFirestoreCreate>(uid, input.loopId), patch);
}
