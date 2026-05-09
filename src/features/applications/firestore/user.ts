import type { Firestore} from "firebase/firestore";
import { getDoc, writeBatch } from "firebase/firestore";

import type { UserDoc } from "./documents.types";
import { stripUndefinedDeep } from "./lib/sanitize";
import { nowTs } from "./lib/time";
import { userDocRef } from "./refs";

export async function getUserDoc(
  db: Firestore,
  userId: string,
): Promise<UserDoc | null> {
  const ref = userDocRef(db, userId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as UserDoc) : null;
}

/**
 * Create user root doc according to schema
 */
export async function ensureUserDoc(db: Firestore, userId: string): Promise<void> {
  const ref = userDocRef(db, userId);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  const t = nowTs();
  const userDoc: UserDoc = {
    createdAt: t,
    updatedAt: t,
    profile: { location: { timezone: "Europe/Berlin" } },
    skills: [],
    matchSettings: {
      weights: {
        skills: 45,
        experience: 20,
        language: 10,
        location: 10,
        domain: 10,
        salary: 5,
      },
      hardFilters: { allowOnSite: true, allowHybrid: true, allowRemote: true },
      skillSynonymsVersion: 1,
    },
  };

  const batch = writeBatch(db);
  batch.set(ref, stripUndefinedDeep(userDoc));
  await batch.commit();
}
