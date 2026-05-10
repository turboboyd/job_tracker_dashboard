import type { Firestore } from "firebase/firestore";
import {
  Timestamp,
  deleteDoc,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { stripUndefinedDeep } from "./lib/sanitize";
import { nowTs, timestampFromDate } from "./lib/time";
import {
  buildContactDoc,
  buildInteractionDoc,
  type CreateContactInput,
  type CreateInteractionInput,
  type UpdateContactInput,
  type UpdateInteractionInput,
} from "./mappers";
import { getContact } from "./queries";
import {
  contactDocRef,
  contactsColRef,
  interactionDocRef,
  interactionsColRef,
} from "./refs";

// ─── Contacts ────────────────────────────────────────────────────────────────

/**
 * Create a new contact. Returns the new contactId.
 */
export async function createContact(
  db: Firestore,
  userId: string,
  input: CreateContactInput,
): Promise<string> {
  const now = nowTs();
  const colRef = contactsColRef(db, userId);
  const newRef = doc(colRef);
  const contactDoc = buildContactDoc(userId, input, now);

  await setDoc(newRef, stripUndefinedDeep(contactDoc));
  return newRef.id;
}

/**
 * Update an existing contact (partial patch).
 */
export async function updateContact(
  db: Firestore,
  userId: string,
  contactId: string,
  input: UpdateContactInput,
): Promise<void> {
  const now = nowTs();
  const patch: Record<string, unknown> = { updatedAt: now };

  if (input.firstName !== undefined) patch.firstName = input.firstName.trim();
  if (input.lastName !== undefined) patch.lastName = input.lastName.trim();
  if (input.role !== undefined) patch.role = input.role;
  if (input.phones !== undefined) patch.phones = input.phones;
  if (input.emails !== undefined) patch.emails = input.emails;
  if (input.companyName !== undefined) patch.companyName = input.companyName.trim();
  if (input.applicationIds !== undefined) patch.applicationIds = input.applicationIds;
  if (input.linkedInUrl !== undefined) patch.linkedInUrl = input.linkedInUrl.trim();
  if (input.notes !== undefined) patch.notes = input.notes.trim();
  if (input.tags !== undefined) patch.tags = input.tags;
  if (input.sentiment !== undefined) patch.sentiment = input.sentiment;

  await updateDoc(contactDocRef(db, userId, contactId), stripUndefinedDeep(patch));
}

/**
 * Soft-delete a contact (archive flag).
 */
export async function archiveContact(
  db: Firestore,
  userId: string,
  contactId: string,
): Promise<void> {
  await updateDoc(contactDocRef(db, userId, contactId), {
    archived: true,
    updatedAt: nowTs(),
  });
}

/**
 * Hard-delete a contact (use only in danger zone / settings).
 */
export async function deleteContact(
  db: Firestore,
  userId: string,
  contactId: string,
): Promise<void> {
  await deleteDoc(contactDocRef(db, userId, contactId));
}

/**
 * Link a contact to an application (adds applicationId to the contact's array).
 */
export async function linkContactToApplication(
  db: Firestore,
  userId: string,
  contactId: string,
  applicationId: string,
): Promise<void> {
  const contact = await getContact(db, userId, contactId);
  if (!contact) throw new Error(`Contact ${contactId} not found`);

  const existing = contact.applicationIds ?? [];
  if (existing.includes(applicationId)) return; // already linked

  await updateDoc(contactDocRef(db, userId, contactId), {
    applicationIds: [...existing, applicationId],
    updatedAt: nowTs(),
  });
}

/**
 * Unlink a contact from an application.
 */
export async function unlinkContactFromApplication(
  db: Firestore,
  userId: string,
  contactId: string,
  applicationId: string,
): Promise<void> {
  const contact = await getContact(db, userId, contactId);
  if (!contact) return;

  const next = (contact.applicationIds ?? []).filter((id) => id !== applicationId);

  await updateDoc(contactDocRef(db, userId, contactId), {
    applicationIds: next,
    updatedAt: nowTs(),
  });
}

// ─── Interactions ────────────────────────────────────────────────────────────

/**
 * Log a new interaction.
 * Optionally updates lastContactedAt on the linked contact (in the same batch).
 * Returns the new interactionId.
 */
export async function createInteraction(
  db: Firestore,
  userId: string,
  input: CreateInteractionInput,
): Promise<string> {
  const now = nowTs();
  const colRef = interactionsColRef(db, userId);
  const newRef = doc(colRef);
  const interactionDoc = buildInteractionDoc(userId, input, now);

  const batch = writeBatch(db);
  batch.set(newRef, stripUndefinedDeep(interactionDoc));

  // Update lastContactedAt on the contact — keeps contact list sortable
  if (input.contactId) {
    const contactRef = contactDocRef(db, userId, input.contactId);
    batch.update(contactRef, {
      lastContactedAt: Timestamp.fromDate(input.occurredAt),
      updatedAt: now,
    });
  }

  await batch.commit();
  return newRef.id;
}

/**
 * Update an existing interaction.
 */
export async function updateInteraction(
  db: Firestore,
  userId: string,
  interactionId: string,
  input: UpdateInteractionInput,
): Promise<void> {
  const now = nowTs();
  const patch: Record<string, unknown> = { updatedAt: now };

  if (input.type !== undefined) patch.type = input.type;
  if (input.direction !== undefined) patch.direction = input.direction;
  if (input.occurredAt !== undefined) patch.occurredAt = timestampFromDate(input.occurredAt);
  if (input.durationMin !== undefined) patch.durationMin = input.durationMin;
  if (input.summary !== undefined) patch.summary = input.summary.trim();
  if (input.agreements !== undefined) patch.agreements = input.agreements.trim();
  if (input.nextStepText !== undefined) patch.nextStepText = input.nextStepText.trim();
  if ("nextStepAt" in input) {
    patch.nextStepAt = input.nextStepAt ? timestampFromDate(input.nextStepAt) : null;
  }
  if (input.sentiment !== undefined) patch.sentiment = input.sentiment;

  await updateDoc(
    interactionDocRef(db, userId, interactionId),
    stripUndefinedDeep(patch),
  );
}

/**
 * Delete an interaction (hard delete — no side effects on contact).
 */
export async function deleteInteraction(
  db: Firestore,
  userId: string,
  interactionId: string,
): Promise<void> {
  await deleteDoc(interactionDocRef(db, userId, interactionId));
}

/**
 * Clear the nextStep from an interaction (mark as done).
 */
export async function clearInteractionNextStep(
  db: Firestore,
  userId: string,
  interactionId: string,
): Promise<void> {
  await updateDoc(interactionDocRef(db, userId, interactionId), {
    nextStepAt: null,
    nextStepText: "",
    updatedAt: nowTs(),
  });
}
