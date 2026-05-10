/**
 * Stage = основной этап процесса.
 * Это поле должно быть стабильным (используется в фильтрах/запросах/графиках).
 */
export type Stage =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE"
  | "ARCHIVED";

export const STAGES: readonly Stage[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
  "ARCHIVED",
] as const;

/**
 * “Статус” = конкретное состояние карточки (подстатус).
 * Stage используется для группировки/фильтров, но UI чаще работает со StatusKey.
 */
export type StatusKey =
  | "SAVED"
  | "REVIEWED"
  | "CV_ADAPTING"
  | "COVER_LETTER_WRITING"
  | "READY_TO_APPLY"
  | "APPLIED"
  | "REAPPLIED"
  | "WAITING_RESPONSE"
  | "AUTO_REPLY_RECEIVED"
  | "RESPONSE_RECEIVED"
  | "MORE_INFO_REQUESTED"
  | "FOLLOW_UP_REQUIRED"
  | "WONT_APPLY"
  | "HR_CALL_SCHEDULED"
  | "HR_PASSED"
  | "HR_FAILED"
  | "TECH_SCHEDULED"
  | "TECH_PASSED"
  | "TECH_FAILED"
  | "FINAL_INTERVIEW"
  | "TEST_TASK_RECEIVED"
  | "TEST_TASK_SUBMITTED"
  | "WAITING_DECISION"
  | "OFFER_RECEIVED"
  | "OFFER_REVIEWING"
  | "NEGOTIATING"
  | "OFFER_ACCEPTED"
  | "OFFER_DECLINED"
  | "OFFER_RESCINDED"
  | "START_PLANNED"
  | "STARTED"
  | "REJECTED_PRE_INTERVIEW"
  | "REJECTED_AFTER_INTERVIEW"
  | "ROLE_CLOSED"
  | "GHOSTING"
  | "ARCHIVED_GENERAL"
  | "KEEP_IN_TOUCH"
  | "WITHDREW_BEFORE_START";

export type StatusColor =
  | "neutral"
  | "info"
  | "warning"
  | "success"
  | "danger"
  | "purple";

export const STATUS_COLORS: readonly StatusColor[] = [
  "neutral",
  "info",
  "warning",
  "success",
  "danger",
  "purple",
] as const;

export type BoardColumnKey =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE"
  | "ARCHIVED";

export const BOARD_COLUMN_KEYS: readonly BoardColumnKey[] = [
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
  "ARCHIVED",
] as const;

export interface StatusMeta {
  key: StatusKey;
  stage: Stage;
  labelKey: string;
  color: StatusColor;
  boardColumn: BoardColumnKey;
  order: number;
}

