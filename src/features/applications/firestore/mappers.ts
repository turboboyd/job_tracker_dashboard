import { Timestamp } from "firebase/firestore";

import type {
  ApplicationDoc,
  EmploymentType,
  ProcessStage,
  ProcessStatus,
  WorkMode,
} from "./types";

export interface CreateApplicationInput {
  companyName: string;
  roleTitle: string;
  vacancyUrl?: string;
  source?: string;
  status?: ProcessStatus;
  locationText?: string;
  workMode?: WorkMode;
  employmentType?: EmploymentType;
  tags?: string[];
  currentNote?: string;
  rawDescription?: string;
  loopId?: string;
  loopPlatform?: string;
  loopMatchedAt?: Date;
  loopSource?: "loop" | "manual" | "import";
  legacyMatchId?: string;
}

export function buildManualLoopDoc(t: Timestamp) {
  return {
    name: "Manual",
    titles: [],
    location: "",
    radiusKm: 0,
    remoteMode: "manual",
    platforms: [],
    filters: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAtTs: t,
    updatedAtTs: t,
  };
}

export function buildCreateApplicationDoc(
  userId: string,
  input: CreateApplicationInput,
  t: Timestamp,
): ApplicationDoc {
  const status: ProcessStatus = input.status ?? "SAVED";

  const job: ApplicationDoc["job"] = {
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    ...(input.vacancyUrl ? { vacancyUrl: input.vacancyUrl } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.locationText ? { locationText: input.locationText } : {}),
    ...(input.workMode ? { workMode: input.workMode } : {}),
    ...(input.employmentType ? { employmentType: input.employmentType } : {}),
  };

  const notes: ApplicationDoc["notes"] = {
    ...(input.currentNote ? { currentNote: input.currentNote } : {}),
    ...(input.tags ? { tags: input.tags } : { tags: [] }),
  };

  const vacancy = input.rawDescription ? { rawDescription: input.rawDescription } : undefined;
  const effectiveLoopId = input.loopId ?? "manual";

  const loopLinkage: ApplicationDoc["loopLinkage"] = {
    loopId: effectiveLoopId,
    ...(input.loopPlatform ? { platform: input.loopPlatform } : {}),
    ...(input.loopMatchedAt ? { matchedAt: Timestamp.fromDate(input.loopMatchedAt) } : {}),
    source: input.loopSource ?? (input.loopId ? "loop" : "manual"),
    ...(input.legacyMatchId ? { legacyMatchId: input.legacyMatchId } : {}),
  };

  return {
    createdAt: t,
    updatedAt: t,
    createdBy: userId,
    archived: false,
    job,
    process: {
      status,
      lastStatusChangeAt: t,
      contactAttempts: 0,
      followUpLevel: 0,
      needsFollowUp: false,
      needsReapplySuggestion: false,
    },
    notes,
    ...(vacancy ? { vacancy } : {}),
    loopLinkage,
  };
}

export function mapLegacyStatusToStageSub(
  status: ProcessStatus,
): { stage: ProcessStage; subStatus: string } {
  switch (status) {
    case "SAVED":
      return { stage: "ACTIVE", subStatus: "SAVED" };
    case "PLANNED":
      return { stage: "ACTIVE", subStatus: "PLANNED" };
    case "APPLIED":
      return { stage: "ACTIVE", subStatus: "APPLIED" };
    case "VIEWED":
      return { stage: "ACTIVE", subStatus: "VIEWED" };
    case "INTERVIEW_1":
      return { stage: "INTERVIEW", subStatus: "HR_CALL_SCHEDULED" };
    case "INTERVIEW_2":
      return { stage: "INTERVIEW", subStatus: "TECH_INTERVIEW_SCHEDULED" };
    case "TEST_TASK":
      return { stage: "INTERVIEW", subStatus: "TEST_TASK_ASSIGNED" };
    case "OFFER":
      return { stage: "OFFER", subStatus: "OFFER_RECEIVED" };
    case "REJECTED":
      return { stage: "REJECTED", subStatus: "REJECTED_PRE_INTERVIEW" };
    case "NO_RESPONSE":
      return { stage: "NO_RESPONSE", subStatus: "GHOSTING" };
    case "WITHDREW":
      return { stage: "ARCHIVED", subStatus: "WITHDREW_BEFORE_START" };
    default:
      return { stage: "ACTIVE", subStatus: "SAVED" };
  }
}
