import { auth } from "src/shared/config/firebase/firebase";

import type { UserProfile } from "../model/types";

export function makeDefaultProfile(uid: string): UserProfile {

  return {
    uid,
    displayName: auth.currentUser?.displayName ?? null,
    email: auth.currentUser?.email ?? null,
    photoURL: auth.currentUser?.photoURL ?? null,

    language: "ru",
    timezone: "Europe/Berlin",
    dateFormat: "DD.MM.YYYY",

    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
