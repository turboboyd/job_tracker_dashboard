import type { BoardColumnKey, StatusKey } from "src/entities/application";

export const COLUMN_DEFAULT_STATUS: Record<BoardColumnKey, StatusKey> = {
  ACTIVE: "APPLIED",
  INTERVIEW: "HR_CALL_SCHEDULED",
  OFFER: "OFFER_RECEIVED",
  HIRED: "OFFER_ACCEPTED",
  REJECTED: "REJECTED_PRE_INTERVIEW",
  NO_RESPONSE: "GHOSTING",
  ARCHIVED: "ARCHIVED_GENERAL",
};
