import { auth } from "src/shared/config/firebase/firebase";

import type { UserProfile } from "../model/types";

import { makeDefaultProfile } from "./defaultProfile";

export function normalizeProfile(uid: string, raw?: Partial<UserProfile> | null): UserProfile {
  const base = makeDefaultProfile(uid);
  const user = auth.currentUser;

  const merged: UserProfile = {
    ...base,
    ...(raw ?? {}),
    uid,

    displayName: user?.displayName ?? (raw?.displayName ?? base.displayName),
    photoURL: user?.photoURL ?? (raw?.photoURL ?? base.photoURL),
    email: user?.email ?? (raw?.email ?? base.email),

    createdAt: raw && typeof raw.createdAt === "number" ? raw.createdAt : base.createdAt,
    updatedAt: raw && typeof raw.updatedAt === "number" ? raw.updatedAt : base.updatedAt,
  };

  return merged;
}
