import type { BoardColumnKey, ProcessStatus, StatusKey } from "src/entities/application";

/**
 * Columns shown on the Applications board.
 *
 * The application `ProcessStatus` taxonomy only reaches these five stages
 * (HIRED has no ProcessStatus, ARCHIVED is a separate boolean flag), so the
 * board renders exactly these columns, in this order.
 */
export const APPLICATION_BOARD_COLUMNS: readonly BoardColumnKey[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "REJECTED",
  "NO_RESPONSE",
];

/**
 * Representative application `ProcessStatus` applied when a card is dropped into
 * a column (drag-to-change-status). Only the five rendered columns are mapped.
 */
export const COLUMN_TO_PROCESS_STATUS: Partial<Record<BoardColumnKey, ProcessStatus>> = {
  ACTIVE: "APPLIED",
  INTERVIEW: "INTERVIEW_1",
  OFFER: "OFFER",
  REJECTED: "REJECTED",
  NO_RESPONSE: "NO_RESPONSE",
};

/** Legacy StatusKey-based column mapping (kept for reference/back-compat). */
export const COLUMN_DEFAULT_STATUS: Record<BoardColumnKey, StatusKey> = {
  ACTIVE: "APPLIED",
  INTERVIEW: "HR_CALL_SCHEDULED",
  OFFER: "OFFER_RECEIVED",
  HIRED: "OFFER_ACCEPTED",
  REJECTED: "REJECTED_PRE_INTERVIEW",
  NO_RESPONSE: "GHOSTING",
  ARCHIVED: "ARCHIVED_GENERAL",
};
