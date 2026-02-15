import { addDoc } from "firebase/firestore";

import { userLoopsCol } from "src/shared/api/firestoreRefs";

import type { CreateLoopInput } from "../../loopApi.types";
import { cleanLoopCreate } from "../../mappers/loopApi.mappers";

export async function createLoopQuery(
  uid: string,
  input: CreateLoopInput,
): Promise<{ id: string }> {
  const payload = cleanLoopCreate(input);
  const ref = await addDoc(userLoopsCol(uid), payload);
  return { id: ref.id };
}
