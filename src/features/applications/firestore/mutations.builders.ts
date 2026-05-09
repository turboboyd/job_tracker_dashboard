import { Timestamp, type Timestamp as FirestoreTimestamp } from "firebase/firestore";

import { buildDerivedPatch, computeDerived, withRoleFingerprint } from "./derived";
import { applyDotPatch } from "./lib/patch";
import { stripUndefinedDeep } from "./lib/sanitize";
import { mapLegacyStatusToStageSubStatus } from "./mutations.helpers";
import type { CreateApplicationInput } from "./mutations.types";
import type { ApplicationDoc, DotPatch, ProcessStatus, UserDoc } from "./types";

export function resolveEffectiveLoopId(loopId?: string): string {
  return loopId ?? "manual";
}

function buildApplicationJob(input: CreateApplicationInput): ApplicationDoc["job"] {
  return {
    companyName: input.companyName,
    roleTitle: input.roleTitle,
    ...(input.vacancyUrl ? { vacancyUrl: input.vacancyUrl } : {}),
    ...(input.source ? { source: input.source } : {}),
    ...(input.locationText ? { locationText: input.locationText } : {}),
    ...(input.workMode ? { workMode: input.workMode } : {}),
    ...(input.employmentType ? { employmentType: input.employmentType } : {}),
  };
}

function buildApplicationNotes(
  input: CreateApplicationInput,
): NonNullable<ApplicationDoc["notes"]> {
  return {
    ...(input.currentNote ? { currentNote: input.currentNote } : {}),
    ...(input.tags ? { tags: input.tags } : { tags: [] }),
  };
}

function buildApplicationVacancy(
  input: CreateApplicationInput,
): ApplicationDoc["vacancy"] | undefined {
  return input.rawDescription ? { rawDescription: input.rawDescription } : undefined;
}

function buildApplicationLoopLinkage(
  input: CreateApplicationInput,
  loopId: string,
): NonNullable<ApplicationDoc["loopLinkage"]> {
  return {
    loopId,
    ...(input.loopPlatform ? { platform: input.loopPlatform } : {}),
    ...(input.loopMatchedAt ? { matchedAt: Timestamp.fromDate(input.loopMatchedAt) } : {}),
    source: input.loopSource ?? (input.loopId ? "loop" : "manual"),
    ...(input.legacyMatchId ? { legacyMatchId: input.legacyMatchId } : {}),
  };
}

export function buildBaseApplicationDoc(
  userId: string,
  input: CreateApplicationInput,
  createdAt: FirestoreTimestamp,
  loopId: string,
): ApplicationDoc {
  const status: ProcessStatus = input.status ?? "SAVED";
  const vacancy = buildApplicationVacancy(input);

  return {
    createdAt,
    updatedAt: createdAt,
    createdBy: userId,
    archived: false,
    job: buildApplicationJob(input),
    process: {
      status,
      lastStatusChangeAt: createdAt,
      contactAttempts: 0,
      followUpLevel: 0,
      needsFollowUp: false,
      needsReapplySuggestion: false,
    },
    notes: buildApplicationNotes(input),
    ...(vacancy ? { vacancy } : {}),
    loopLinkage: buildApplicationLoopLinkage(input, loopId),
  };
}

export function applyDerivedApplicationDoc(
  user: UserDoc | null,
  application: ApplicationDoc,
  timestamp: FirestoreTimestamp,
): ApplicationDoc {
  const derived = computeDerived(user, application, timestamp);

  return {
    ...withRoleFingerprint(application, derived.roleFingerprint),
    ...(derived.matching ? { matching: derived.matching } : {}),
    process: {
      ...application.process,
      ...derived.followUp,
      ...derived.reapply,
    },
    priority: derived.priority,
  };
}

export function buildDerivedUpdatePatch(
  user: UserDoc | null,
  current: ApplicationDoc,
  patch: Record<string, unknown>,
  updatedAt: FirestoreTimestamp,
): DotPatch {
  const patchRaw: DotPatch = { ...patch, updatedAt };
  const next = applyDotPatch(
    current as unknown as Record<string, unknown>,
    patchRaw,
  ) as unknown as ApplicationDoc;
  const derived = computeDerived(user, next, updatedAt);

  return stripUndefinedDeep({
    ...patchRaw,
    ...buildDerivedPatch(derived),
  });
}

export function buildStatusUpdatePatch(
  current: ApplicationDoc,
  toStatus: ProcessStatus,
  updatedAt: FirestoreTimestamp,
): Record<string, unknown> {
  const mappedStatus = mapLegacyStatusToStageSubStatus(toStatus);
  const patch: Record<string, unknown> = {
    "process.status": toStatus,
    "process.lastStatusChangeAt": updatedAt,
    "process.stage": mappedStatus.stage,
    "process.subStatus": mappedStatus.subStatus,
  };

  if (toStatus === "APPLIED" && !current.process.appliedAt) {
    patch["process.appliedAt"] = updatedAt;
  }

  return patch;
}

export function buildGhostingPatch(updatedAt: FirestoreTimestamp): Record<string, unknown> {
  return {
    "process.status": "NO_RESPONSE",
    "process.lastStatusChangeAt": updatedAt,
    "process.stage": "NO_RESPONSE",
    "process.subStatus": "GHOSTING",
    updatedAt,
  };
}
