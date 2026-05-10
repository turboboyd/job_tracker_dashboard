import type { StatusKey } from "./status.definitions";

export type LegacyProcessStatus =
  | "SAVED"
  | "PLANNED"
  | "APPLIED"
  | "VIEWED"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "TEST_TASK"
  | "OFFER"
  | "REJECTED"
  | "NO_RESPONSE";

const LEGACY_TO_STATUS: Record<LegacyProcessStatus, StatusKey> = {
  SAVED: "SAVED",
  PLANNED: "READY_TO_APPLY",
  APPLIED: "APPLIED",
  VIEWED: "RESPONSE_RECEIVED",
  INTERVIEW_1: "HR_CALL_SCHEDULED",
  INTERVIEW_2: "TECH_SCHEDULED",
  TEST_TASK: "TEST_TASK_RECEIVED",
  OFFER: "OFFER_RECEIVED",
  REJECTED: "REJECTED_PRE_INTERVIEW",
  NO_RESPONSE: "GHOSTING",
};

export function legacyStatusToStatusKey(value: unknown): StatusKey | null {
  if (typeof value !== "string") return null;
  const normalized = value.toUpperCase() as LegacyProcessStatus;
  return normalized in LEGACY_TO_STATUS ? LEGACY_TO_STATUS[normalized] : null;
}

