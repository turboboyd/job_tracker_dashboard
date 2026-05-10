import type { Timestamp } from "firebase/firestore";

import type {
  ContactRole,
  EmailLabel,
  PhoneLabel,
} from "./primitive.types";

/**
 * A phone entry stored inside a Contact document.
 */
export interface PhoneEntry {
  number: string;
  label: PhoneLabel;
}

/**
 * An email entry stored inside a Contact document.
 */
export interface EmailEntry {
  address: string;
  label: EmailLabel;
}

/**
 * The Firestore document shape for a contact (recruiter, HR, hiring manager, etc.).
 * Stored at: users/{uid}/contacts/{contactId}
 */
export interface ContactDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;

  /** Personal info */
  firstName: string;
  lastName: string;

  /** Contact details */
  phones: PhoneEntry[];
  emails: EmailEntry[];

  /** Professional context */
  role: ContactRole;
  companyName?: string;
  /** Company application IDs this contact is linked to */
  applicationIds?: string[];

  /** Social */
  linkedInUrl?: string;

  /** Notes and tags */
  notes?: string;
  tags?: string[];

  /** Derived / cached */
  lastContactedAt?: Timestamp;
  sentiment?: "positive" | "neutral" | "negative";

  archived: boolean;
}
