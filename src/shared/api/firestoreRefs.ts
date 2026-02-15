import { collection, doc } from "firebase/firestore";

import { db } from "src/shared/config/firebase/firebase";

// -----------------------------
// User-owned collections
// -----------------------------

export const userLoopsCol = (uid: string) => collection(db, "users", uid, "loops");

export const userLoopDoc = (uid: string, loopId: string) =>
  doc(db, "users", uid, "loops", loopId);

export const userLoopMatchesCol = (uid: string) =>
  collection(db, "users", uid, "loopMatches");

export const userLoopMatchDoc = (uid: string, matchId: string) =>
  doc(db, "users", uid, "loopMatches", matchId);

// -----------------------------
// User subdocs
// -----------------------------

export const userSettingsDoc = (uid: string) =>
  doc(db, "users", uid, "private", "settings");

export const userOutcomeDoc = (uid: string) =>
  doc(db, "users", uid, "private", "outcome");

// -----------------------------
// Public stats
// -----------------------------

export const publicStatsDoc = (docId: string) => doc(db, "publicStats", docId);
