import type { Firestore } from "firebase/firestore";
import { collection, doc } from "firebase/firestore";

// ─── Contacts ──────────────────────────────────────────────────────────────

/**
 * users/{uid}/contacts
 */
export function contactsColRef(db: Firestore, userId: string) {
  return collection(db, "users", userId, "contacts");
}

/**
 * users/{uid}/contacts/{contactId}
 */
export function contactDocRef(db: Firestore, userId: string, contactId: string) {
  return doc(db, "users", userId, "contacts", contactId);
}

// ─── Interactions ───────────────────────────────────────────────────────────

/**
 * users/{uid}/interactions
 * Flat collection — easier to query by applicationId or contactId.
 */
export function interactionsColRef(db: Firestore, userId: string) {
  return collection(db, "users", userId, "interactions");
}

/**
 * users/{uid}/interactions/{interactionId}
 */
export function interactionDocRef(db: Firestore, userId: string, interactionId: string) {
  return doc(db, "users", userId, "interactions", interactionId);
}
