import type { Firestore } from "firebase/firestore";
import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { ContactDoc, InteractionDoc } from "src/entities/contact";

import { contactDocRef, contactsColRef, interactionDocRef, interactionsColRef } from "./refs";

// ─── Contact queries ─────────────────────────────────────────────────────────

export interface ContactRow {
  id: string;
  data: ContactDoc;
}

export interface InteractionRow {
  id: string;
  data: InteractionDoc;
}

function mapContactRow(snap: { id: string; data(): unknown }): ContactRow {
  return { id: snap.id, data: snap.data() as ContactDoc };
}

function mapInteractionRow(snap: { id: string; data(): unknown }): InteractionRow {
  return { id: snap.id, data: snap.data() as InteractionDoc };
}

/**
 * Fetch a single contact by ID.
 */
export async function getContact(
  db: Firestore,
  userId: string,
  contactId: string,
): Promise<ContactDoc | null> {
  const snap = await getDoc(contactDocRef(db, userId, contactId));
  return snap.exists() ? (snap.data() as ContactDoc) : null;
}

/**
 * Fetch all active (non-archived) contacts, sorted by lastName then firstName.
 */
export async function getContacts(
  db: Firestore,
  userId: string,
  take = 200,
): Promise<ContactRow[]> {
  const q = query(
    contactsColRef(db, userId),
    where("archived", "==", false),
    orderBy("lastName", "asc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapContactRow);
}

/**
 * Fetch contacts linked to a specific application.
 */
export async function getContactsByApplication(
  db: Firestore,
  userId: string,
  applicationId: string,
  take = 50,
): Promise<ContactRow[]> {
  const q = query(
    contactsColRef(db, userId),
    where("applicationIds", "array-contains", applicationId),
    where("archived", "==", false),
    orderBy("lastName", "asc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapContactRow);
}

// ─── Interaction queries ─────────────────────────────────────────────────────

/**
 * Fetch a single interaction.
 */
export async function getInteraction(
  db: Firestore,
  userId: string,
  interactionId: string,
): Promise<InteractionDoc | null> {
  const snap = await getDoc(interactionDocRef(db, userId, interactionId));
  return snap.exists() ? (snap.data() as InteractionDoc) : null;
}

/**
 * Fetch interactions for a specific application, newest first.
 */
export async function getInteractionsByApplication(
  db: Firestore,
  userId: string,
  applicationId: string,
  take = 100,
): Promise<InteractionRow[]> {
  const q = query(
    interactionsColRef(db, userId),
    where("applicationId", "==", applicationId),
    orderBy("occurredAt", "desc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapInteractionRow);
}

/**
 * Fetch interactions for a specific contact, newest first.
 */
export async function getInteractionsByContact(
  db: Firestore,
  userId: string,
  contactId: string,
  take = 100,
): Promise<InteractionRow[]> {
  const q = query(
    interactionsColRef(db, userId),
    where("contactId", "==", contactId),
    orderBy("occurredAt", "desc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapInteractionRow);
}

/**
 * Fetch all interactions that have a pending next-step (nextStepAt set),
 * ordered by nextStepAt ascending — used by the reminder engine.
 */
export async function getPendingNextStepInteractions(
  db: Firestore,
  userId: string,
  take = 50,
): Promise<InteractionRow[]> {
  const q = query(
    interactionsColRef(db, userId),
    where("nextStepAt", "!=", null),
    orderBy("nextStepAt", "asc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapInteractionRow);
}

export type { ContactRow as ContactRowType, InteractionRow as InteractionRowType };
