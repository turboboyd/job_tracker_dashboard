import { getDoc, setDoc, serverTimestamp } from "firebase/firestore";

import { makeDefaultProfile } from "../lib/defaultProfile";
import { normalizeProfile } from "../lib/normalizeProfile";
import type { UserProfile } from "../model/types";

import { userProfileDocRef } from "./userProfileRefs";

export async function getOrCreateProfile(uid: string): Promise<UserProfile> {
  const refDoc = userProfileDocRef(uid);
  const snap = await getDoc(refDoc);

  if (snap.exists()) {
    const raw = snap.data() as Partial<UserProfile>;
    return normalizeProfile(uid, raw);
  }

  const created = makeDefaultProfile(uid);

  await setDoc(refDoc, {
    ...created,
    _createdAtServer: serverTimestamp(),
    _updatedAtServer: serverTimestamp(),
  });

  return created;
}
