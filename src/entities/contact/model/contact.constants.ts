import type { ContactRole, InteractionType } from "./primitive.types";

/**
 * Human-readable default labels for ContactRole values.
 * Used as fallbacks when i18n key is not yet translated.
 */
export const CONTACT_ROLE_LABELS: Record<ContactRole, string> = {
  HR: "HR",
  RECRUITER: "Recruiter",
  TECH_INTERVIEWER: "Tech Interviewer",
  HIRING_MANAGER: "Hiring Manager",
  REFERRAL: "Referral",
  OTHER: "Other",
};

export const CONTACT_ROLE_KEYS: ContactRole[] = [
  "HR",
  "RECRUITER",
  "TECH_INTERVIEWER",
  "HIRING_MANAGER",
  "REFERRAL",
  "OTHER",
];

/**
 * Human-readable default labels for InteractionType values.
 */
export const INTERACTION_TYPE_LABELS: Record<InteractionType, string> = {
  CALL: "Phone Call",
  EMAIL: "Email",
  MESSAGE: "Message",
  MEETING: "Meeting",
  OTHER: "Other",
};

export const INTERACTION_TYPE_KEYS: InteractionType[] = [
  "CALL",
  "EMAIL",
  "MESSAGE",
  "MEETING",
  "OTHER",
];

/**
 * Lucide icon names mapped to interaction types.
 * Imported lazily in UI components to avoid circular deps.
 */
export const INTERACTION_TYPE_ICON: Record<InteractionType, string> = {
  CALL: "Phone",
  EMAIL: "Mail",
  MESSAGE: "MessageSquare",
  MEETING: "Users",
  OTHER: "Zap",
};
