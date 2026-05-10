import { deleteDoc } from "firebase/firestore";

import { auth } from "src/shared/config/firebase/auth";

import { userProfileDocRef } from "./userProfileRefs";

export async function deleteUserProfile(uid: string): Promise<void> {
  const user = auth.currentUser;
  if (user?.uid !== uid) {
    throw new Error("Not authenticated");
  }

  await deleteDoc(userProfileDocRef(uid));
}
