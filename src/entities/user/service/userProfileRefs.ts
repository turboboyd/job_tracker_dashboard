import { doc } from "firebase/firestore";

import { db } from "src/shared/config/firebase/firebase";

export const userProfilesCollection = "userProfiles" as const;

export function userProfileDocRef(uid: string) {
  return doc(db, userProfilesCollection, uid);
}
