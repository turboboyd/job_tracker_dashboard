import type { Firestore} from "firebase/firestore";
import { collection, doc } from "firebase/firestore";

export function usersRef(db: Firestore) {
  return collection(db, "users");
}

export function userDocRef(db: Firestore, userId: string) {
  return doc(usersRef(db), userId);
}

export function applicationsColRef(db: Firestore, userId: string) {
  return collection(db, "users", userId, "applications");
}

export function applicationDocRef(db: Firestore, userId: string, appId: string) {
  return doc(db, "users", userId, "applications", appId);
}

export function historyColRef(db: Firestore, userId: string, appId: string) {
  return collection(db, "users", userId, "applications", appId, "history");
}

export function historyDocRef(
  db: Firestore,
  userId: string,
  appId: string,
  historyId: string,
) {
  return doc(db, "users", userId, "applications", appId, "history", historyId);
}
