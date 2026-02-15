import { updateProfile } from "firebase/auth";
import { getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

import { auth } from "src/shared/config/firebase/firebase";

import { makeDefaultProfile } from "../lib/defaultProfile";
import { normalizeProfile } from "../lib/normalizeProfile";
import type { UpdateUserProfileInput, UserProfile } from "../model/types";

import { uploadAvatar } from "./uploadAvatar";
import { userProfileDocRef } from "./userProfileRefs";

export async function updateUserProfile(uid: string, data: UpdateUserProfileInput): Promise<UserProfile> {
  const user = auth.currentUser;
  if (!user || user.uid !== uid) {
    throw new Error("Not authenticated");
  }

  // 1) upload avatar (optional)
  let uploadedPhotoURL: string | undefined;
  if (data.photoFile) {
    uploadedPhotoURL = await uploadAvatar(uid, data.photoFile);
  }

  // 2) auth update
  const authPatch: { displayName?: string | null; photoURL?: string | null } = {};
  if ("displayName" in data) authPatch.displayName = data.displayName ?? null;
  if (typeof uploadedPhotoURL === "string") authPatch.photoURL = uploadedPhotoURL;

  if (Object.keys(authPatch).length > 0) {
    await updateProfile(user, authPatch);
  }

  // 3) firestore patch
  const patch: Record<string, unknown> = {
    updatedAt: Date.now(),
    _updatedAtServer: serverTimestamp(),
  };

  if ("displayName" in data) patch.displayName = data.displayName ?? null;
  if (typeof uploadedPhotoURL === "string") patch.photoURL = uploadedPhotoURL;

  if ("language" in data && data.language) patch.language = data.language;
  if ("timezone" in data && data.timezone) patch.timezone = data.timezone;
  if ("dateFormat" in data && data.dateFormat) patch.dateFormat = data.dateFormat;

  const refDoc = userProfileDocRef(uid);
  const snap = await getDoc(refDoc);

  if (!snap.exists()) {
    const created = makeDefaultProfile(uid);
    await setDoc(refDoc, {
      ...created,
      ...patch,
      _createdAtServer: serverTimestamp(),
      _updatedAtServer: serverTimestamp(),
    });
  } else {
    await updateDoc(refDoc, patch);
  }

  const updatedSnap = await getDoc(refDoc);
  const raw = updatedSnap.data() as Partial<UserProfile>;

  return normalizeProfile(uid, raw);
}
