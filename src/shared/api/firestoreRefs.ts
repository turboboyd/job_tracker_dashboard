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
  collection(db, "users", uid, "loopMatches") as CollectionReference<T>;

export const userLoopMatchDoc = <T extends DocumentData = DocumentData>(
  uid: string,
  matchId: string
): DocumentReference<T> =>
  doc(db, "users", uid, "loopMatches", matchId) as DocumentReference<T>;

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
