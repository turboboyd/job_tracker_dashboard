import {
  collection,
  doc,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
} from "firebase/firestore";

import { db } from "src/shared/config/firebase/firestore";

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
