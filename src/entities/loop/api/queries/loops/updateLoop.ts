import { updateDoc, type UpdateData } from "firebase/firestore";

import { userLoopDoc } from "src/shared/api/firestoreRefs";

import type { UpdateLoopInput } from "../../loopApi.types";
import { cleanLoopPatch } from "../../mappers/loopApi.mappers";

export async function updateLoopQuery(uid: string, input: UpdateLoopInput): Promise<void> {
  const patch = cleanLoopPatch(input);
  await updateDoc(
    userLoopDoc(uid, input.loopId),
    patch as unknown as UpdateData<Record<string, unknown>>
  );
}
