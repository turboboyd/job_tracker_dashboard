/**
 * Contact primitive types.
 * Mirrors the style of src/entities/application/model/primitive.types.ts
 */

export type ContactRole =
  | "HR"
  | "RECRUITER"
  | "TECH_INTERVIEWER"
  | "HIRING_MANAGER"
  | "REFERRAL"
  | "OTHER";

export type PhoneLabel = "mobile" | "work" | "other";
export type EmailLabel = "work" | "personal" | "other";

export type InteractionType = "CALL" | "EMAIL" | "MESSAGE" | "MEETING" | "OTHER";
export type InteractionDirection = "INBOUND" | "OUTBOUND";

export type InteractionSentiment = "positive" | "neutral" | "negative";
