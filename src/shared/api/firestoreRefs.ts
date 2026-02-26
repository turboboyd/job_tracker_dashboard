import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "src/shared/config/firebase/firebase";

// -----------------------------
// User-owned collections
// -----------------------------

export const userLoopsCol = <T extends DocumentData = DocumentData>(
  uid: string
): CollectionReference<T> =>
  collection(db, "users", uid, "loops") as CollectionReference<T>;

export const userLoopDoc = <T extends DocumentData = DocumentData>(
  uid: string,
  loopId: string
): DocumentReference<T> =>
  doc(db, "users", uid, "loops", loopId) as DocumentReference<T>;

export const userLoopMatchesCol = <T extends DocumentData = DocumentData>(
  uid: string
): CollectionReference<T> =>
  // Legacy path kept for backwards compatibility.
  // The app has moved to the unified applications model.
  // NOTE: Do not write new data to this collection.
  collection(db, "users", uid, "loopMatches") as CollectionReference<T>;

export const userLoopMatchDoc = <T extends DocumentData = DocumentData>(
  uid: string,
  matchId: string
): DocumentReference<T> =>
  // Legacy path kept for backwards compatibility.
  // NOTE: Do not write new data to this doc.
  doc(db, "users", uid, "loopMatches", matchId) as DocumentReference<T>;

// -----------------------------
// Unified Job Search Dashboard v1
// users/{uid}/applications
// -----------------------------

export const userApplicationsCol = <T extends DocumentData = DocumentData>(
  uid: string,
): CollectionReference<T> =>
  collection(db, "users", uid, "applications") as CollectionReference<T>;

export const userApplicationDoc = <T extends DocumentData = DocumentData>(
  uid: string,
  appId: string,
): DocumentReference<T> =>
  doc(db, "users", uid, "applications", appId) as DocumentReference<T>;

// -----------------------------
// User subdocs
// -----------------------------

export const userSettingsDoc = <T extends DocumentData = DocumentData>(
  uid: string
): DocumentReference<T> =>
  doc(db, "users", uid, "private", "settings") as DocumentReference<T>;

export const userOutcomeDoc = <T extends DocumentData = DocumentData>(
  uid: string
): DocumentReference<T> =>
  doc(db, "users", uid, "private", "outcome") as DocumentReference<T>;

// -----------------------------
// Public stats
// -----------------------------

export const publicStatsDoc = <T extends DocumentData = DocumentData>(
  docId: string
): DocumentReference<T> => doc(db, "publicStats", docId) as DocumentReference<T>;
