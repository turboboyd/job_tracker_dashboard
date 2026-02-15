import { deleteDoc } from "firebase/firestore";

import { userLoopDoc } from "src/shared/api/firestoreRefs";

export type DeleteLoopInput = {
  loopId: string;
};

export async function deleteLoopQuery(uid: string, input: DeleteLoopInput): Promise<void> {
  const { loopId } = input;
  await deleteDoc(userLoopDoc(uid, loopId));
}
