import { Timestamp } from "firebase/firestore";

import type {
  ContactDoc,
  ContactRole,
  EmailEntry,
  InteractionDirection,
  InteractionDoc,
  InteractionSentiment,
  InteractionType,
  PhoneEntry,
} from "src/entities/contact";

// ─── Contact input ──────────────────────────────────────────────────────────

export interface CreateContactInput {
  firstName: string;
  lastName: string;
  role: ContactRole;
  phones?: PhoneEntry[];
  emails?: EmailEntry[];
  companyName?: string;
  applicationIds?: string[];
  linkedInUrl?: string;
  notes?: string;
  tags?: string[];
}

export interface UpdateContactInput {
  firstName?: string;
  lastName?: string;
  role?: ContactRole;
  phones?: PhoneEntry[];
  emails?: EmailEntry[];
  companyName?: string;
  applicationIds?: string[];
  linkedInUrl?: string;
  notes?: string;
  tags?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

// ─── Interaction input ──────────────────────────────────────────────────────

export interface CreateInteractionInput {
  type: InteractionType;
  direction: InteractionDirection;
  occurredAt: Date;
  durationMin?: number;
  summary?: string;
  agreements?: string;
  nextStepAt?: Date;
  nextStepText?: string;
  contactId?: string;
  contactDisplayName?: string;
  applicationId?: string;
  applicationDisplayTitle?: string;
  sentiment?: InteractionSentiment;
}

export interface UpdateInteractionInput {
  type?: InteractionType;
  direction?: InteractionDirection;
  occurredAt?: Date;
  durationMin?: number;
  summary?: string;
  agreements?: string;
  nextStepAt?: Date | null;
  nextStepText?: string;
  sentiment?: InteractionSentiment;
}

// ─── Builders ───────────────────────────────────────────────────────────────

export function buildContactDoc(
  userId: string,
  input: CreateContactInput,
  now: Timestamp,
): ContactDoc {
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    role: input.role,
    phones: input.phones ?? [],
    emails: input.emails ?? [],
    ...(input.companyName ? { companyName: input.companyName.trim() } : {}),
    ...(input.applicationIds?.length ? { applicationIds: input.applicationIds } : {}),
    ...(input.linkedInUrl ? { linkedInUrl: input.linkedInUrl.trim() } : {}),
    ...(input.notes ? { notes: input.notes.trim() } : {}),
    ...(input.tags?.length ? { tags: input.tags } : {}),
    archived: false,
  };
}

export function buildInteractionDoc(
  userId: string,
  input: CreateInteractionInput,
  now: Timestamp,
): InteractionDoc {
  return {
    createdAt: now,
    updatedAt: now,
    createdBy: userId,
    type: input.type,
    direction: input.direction,
    occurredAt: Timestamp.fromDate(input.occurredAt),
    ...(input.durationMin !== undefined ? { durationMin: input.durationMin } : {}),
    ...(input.summary ? { summary: input.summary.trim() } : {}),
    ...(input.agreements ? { agreements: input.agreements.trim() } : {}),
    ...(input.nextStepAt ? { nextStepAt: Timestamp.fromDate(input.nextStepAt) } : {}),
    ...(input.nextStepText ? { nextStepText: input.nextStepText.trim() } : {}),
    ...(input.contactId ? { contactId: input.contactId } : {}),
    ...(input.contactDisplayName ? { contactDisplayName: input.contactDisplayName } : {}),
    ...(input.applicationId ? { applicationId: input.applicationId } : {}),
    ...(input.applicationDisplayTitle ? { applicationDisplayTitle: input.applicationDisplayTitle } : {}),
    ...(input.sentiment ? { sentiment: input.sentiment } : {}),
  };
}
