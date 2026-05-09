import { doc } from "firebase/firestore";

import { db } from "src/shared/config/firebase/firestore";

export const userProfilesCollection = "userProfiles" as const;

export function userProfileDocRef(uid: string) {
  return doc(db, userProfilesCollection, uid);
}
