import type { StatusKey, StatusMeta } from "./status.definitions";

const STATUS_BASE: Record<StatusKey, StatusMeta> = {
  SAVED: { key: "SAVED", stage: "ACTIVE", labelKey: "status.SAVED", color: "neutral", boardColumn: "ACTIVE", order: 10 },
  REVIEWED: { key: "REVIEWED", stage: "ACTIVE", labelKey: "status.REVIEWED", color: "neutral", boardColumn: "ACTIVE", order: 20 },
  CV_ADAPTING: { key: "CV_ADAPTING", stage: "ACTIVE", labelKey: "status.CV_ADAPTING", color: "info", boardColumn: "ACTIVE", order: 30 },
  COVER_LETTER_WRITING: { key: "COVER_LETTER_WRITING", stage: "ACTIVE", labelKey: "status.COVER_LETTER_WRITING", color: "info", boardColumn: "ACTIVE", order: 40 },
  READY_TO_APPLY: { key: "READY_TO_APPLY", stage: "ACTIVE", labelKey: "status.READY_TO_APPLY", color: "info", boardColumn: "ACTIVE", order: 50 },
  APPLIED: { key: "APPLIED", stage: "ACTIVE", labelKey: "status.APPLIED", color: "warning", boardColumn: "ACTIVE", order: 60 },
  REAPPLIED: { key: "REAPPLIED", stage: "ACTIVE", labelKey: "status.REAPPLIED", color: "warning", boardColumn: "ACTIVE", order: 70 },
  WAITING_RESPONSE: { key: "WAITING_RESPONSE", stage: "ACTIVE", labelKey: "status.WAITING_RESPONSE", color: "warning", boardColumn: "ACTIVE", order: 80 },
  AUTO_REPLY_RECEIVED: { key: "AUTO_REPLY_RECEIVED", stage: "ACTIVE", labelKey: "status.AUTO_REPLY_RECEIVED", color: "warning", boardColumn: "ACTIVE", order: 90 },
  RESPONSE_RECEIVED: { key: "RESPONSE_RECEIVED", stage: "ACTIVE", labelKey: "status.RESPONSE_RECEIVED", color: "info", boardColumn: "ACTIVE", order: 100 },
  MORE_INFO_REQUESTED: { key: "MORE_INFO_REQUESTED", stage: "ACTIVE", labelKey: "status.MORE_INFO_REQUESTED", color: "info", boardColumn: "ACTIVE", order: 110 },
  FOLLOW_UP_REQUIRED: { key: "FOLLOW_UP_REQUIRED", stage: "ACTIVE", labelKey: "status.FOLLOW_UP_REQUIRED", color: "warning", boardColumn: "ACTIVE", order: 120 },
  WONT_APPLY: { key: "WONT_APPLY", stage: "REJECTED", labelKey: "status.WONT_APPLY", color: "danger", boardColumn: "REJECTED", order: 900 },
  HR_CALL_SCHEDULED: { key: "HR_CALL_SCHEDULED", stage: "INTERVIEW", labelKey: "status.HR_CALL_SCHEDULED", color: "purple", boardColumn: "INTERVIEW", order: 200 },
  HR_PASSED: { key: "HR_PASSED", stage: "INTERVIEW", labelKey: "status.HR_PASSED", color: "purple", boardColumn: "INTERVIEW", order: 210 },
  HR_FAILED: { key: "HR_FAILED", stage: "REJECTED", labelKey: "status.HR_FAILED", color: "danger", boardColumn: "REJECTED", order: 910 },
  TECH_SCHEDULED: { key: "TECH_SCHEDULED", stage: "INTERVIEW", labelKey: "status.TECH_SCHEDULED", color: "purple", boardColumn: "INTERVIEW", order: 220 },
  TECH_PASSED: { key: "TECH_PASSED", stage: "INTERVIEW", labelKey: "status.TECH_PASSED", color: "purple", boardColumn: "INTERVIEW", order: 230 },
  TECH_FAILED: { key: "TECH_FAILED", stage: "REJECTED", labelKey: "status.TECH_FAILED", color: "danger", boardColumn: "REJECTED", order: 920 },
  FINAL_INTERVIEW: { key: "FINAL_INTERVIEW", stage: "INTERVIEW", labelKey: "status.FINAL_INTERVIEW", color: "purple", boardColumn: "INTERVIEW", order: 240 },
  TEST_TASK_RECEIVED: { key: "TEST_TASK_RECEIVED", stage: "INTERVIEW", labelKey: "status.TEST_TASK_RECEIVED", color: "purple", boardColumn: "INTERVIEW", order: 250 },
  TEST_TASK_SUBMITTED: { key: "TEST_TASK_SUBMITTED", stage: "INTERVIEW", labelKey: "status.TEST_TASK_SUBMITTED", color: "purple", boardColumn: "INTERVIEW", order: 260 },
  WAITING_DECISION: { key: "WAITING_DECISION", stage: "INTERVIEW", labelKey: "status.WAITING_DECISION", color: "purple", boardColumn: "INTERVIEW", order: 270 },
  OFFER_RECEIVED: { key: "OFFER_RECEIVED", stage: "OFFER", labelKey: "status.OFFER_RECEIVED", color: "success", boardColumn: "OFFER", order: 300 },
  OFFER_REVIEWING: { key: "OFFER_REVIEWING", stage: "OFFER", labelKey: "status.OFFER_REVIEWING", color: "success", boardColumn: "OFFER", order: 310 },
  NEGOTIATING: { key: "NEGOTIATING", stage: "OFFER", labelKey: "status.NEGOTIATING", color: "success", boardColumn: "OFFER", order: 320 },
  OFFER_ACCEPTED: { key: "OFFER_ACCEPTED", stage: "HIRED", labelKey: "status.OFFER_ACCEPTED", color: "success", boardColumn: "HIRED", order: 330 },
  OFFER_DECLINED: { key: "OFFER_DECLINED", stage: "ARCHIVED", labelKey: "status.OFFER_DECLINED", color: "neutral", boardColumn: "ARCHIVED", order: 800 },
  OFFER_RESCINDED: { key: "OFFER_RESCINDED", stage: "REJECTED", labelKey: "status.OFFER_RESCINDED", color: "danger", boardColumn: "REJECTED", order: 930 },
  START_PLANNED: { key: "START_PLANNED", stage: "HIRED", labelKey: "status.START_PLANNED", color: "success", boardColumn: "HIRED", order: 400 },
  STARTED: { key: "STARTED", stage: "HIRED", labelKey: "status.STARTED", color: "success", boardColumn: "HIRED", order: 410 },
  REJECTED_PRE_INTERVIEW: { key: "REJECTED_PRE_INTERVIEW", stage: "REJECTED", labelKey: "status.REJECTED_PRE_INTERVIEW", color: "danger", boardColumn: "REJECTED", order: 940 },
  REJECTED_AFTER_INTERVIEW: { key: "REJECTED_AFTER_INTERVIEW", stage: "REJECTED", labelKey: "status.REJECTED_AFTER_INTERVIEW", color: "danger", boardColumn: "REJECTED", order: 950 },
  ROLE_CLOSED: { key: "ROLE_CLOSED", stage: "REJECTED", labelKey: "status.ROLE_CLOSED", color: "danger", boardColumn: "REJECTED", order: 960 },
  GHOSTING: { key: "GHOSTING", stage: "NO_RESPONSE", labelKey: "status.GHOSTING", color: "danger", boardColumn: "NO_RESPONSE", order: 970 },
  ARCHIVED_GENERAL: { key: "ARCHIVED_GENERAL", stage: "ARCHIVED", labelKey: "status.ARCHIVED_GENERAL", color: "neutral", boardColumn: "ARCHIVED", order: 980 },
  KEEP_IN_TOUCH: { key: "KEEP_IN_TOUCH", stage: "ARCHIVED", labelKey: "status.KEEP_IN_TOUCH", color: "neutral", boardColumn: "ARCHIVED", order: 990 },
  WITHDREW_BEFORE_START: { key: "WITHDREW_BEFORE_START", stage: "ARCHIVED", labelKey: "status.WITHDREW_BEFORE_START", color: "neutral", boardColumn: "ARCHIVED", order: 995 },
};

export const STATUS: Record<StatusKey, StatusMeta> = Object.fromEntries(
  Object.entries(STATUS_BASE).map(([key, meta]) => [key, { ...meta }]),
) as Record<StatusKey, StatusMeta>;

export const STATUS_KEYS: readonly StatusKey[] = Object.keys(STATUS) as StatusKey[];

export const ALL_STATUSES: StatusMeta[] = Object.values(STATUS).sort(
  (left, right) => left.order - right.order,
);

