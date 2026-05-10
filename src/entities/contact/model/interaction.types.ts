import type { Timestamp } from "firebase/firestore";

import type {
  InteractionDirection,
  InteractionSentiment,
  InteractionType,
} from "./primitive.types";

/**
 * The Firestore document shape for a single communication event.
 * Stored at: users/{uid}/interactions/{interactionId}
 *
 * One interaction can reference both a contact and an application.
 * Both are optional so the model stays flexible.
 */
export interface InteractionDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;

  /** What kind of communication this was */
  type: InteractionType;

  /** Who initiated */
  direction: InteractionDirection;

  /** When it happened (may differ from createdAt if logged retroactively) */
  occurredAt: Timestamp;

  /** Duration in minutes — relevant for calls/meetings */
  durationMin?: number;

  /** Free-text: what was discussed */
  summary?: string;

  /** Free-text: what was agreed upon */
  agreements?: string;

  /** Next step reminder */
  nextStepAt?: Timestamp;
  nextStepText?: string;

  /** Links to other entities */
  contactId?: string;
  /** Denormalised for fast display without joining */
  contactDisplayName?: string;

  applicationId?: string;
  /** Denormalised for fast display */
  applicationDisplayTitle?: string;

  sentiment?: InteractionSentiment;
}
