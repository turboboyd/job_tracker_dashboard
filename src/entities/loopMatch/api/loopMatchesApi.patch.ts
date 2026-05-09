import { Timestamp } from "firebase/firestore";

import type { UpdateLoopMatchInput } from "../model/types";

import { statusKeyToProcessStatus } from "./loopMatchesApi.helpers";

export function buildUpdateMatchDotPatch(
  patch: UpdateLoopMatchInput["patch"],
): Record<string, unknown> {
  const nextPatch: Record<string, unknown> = {};

  if (typeof patch.title === "string") {
    nextPatch["job.roleTitle"] = patch.title;
  }

  if (typeof patch.company === "string") {
    nextPatch["job.companyName"] = patch.company;
  }

  if (typeof patch.location === "string") {
    nextPatch["job.locationText"] = patch.location;
  }

  if (typeof patch.url === "string") {
    nextPatch["job.vacancyUrl"] = patch.url;
  }

  if (typeof patch.platform === "string") {
    nextPatch["loopLinkage.platform"] = patch.platform;
    nextPatch["job.source"] = patch.platform;
  }

  if (typeof patch.description === "string") {
    nextPatch["vacancy.rawDescription"] = patch.description;
  }

  if (typeof patch.matchedAt === "string" && patch.matchedAt.trim()) {
    nextPatch["loopLinkage.matchedAt"] = Timestamp.fromDate(
      new Date(patch.matchedAt),
    );
  }

  if (typeof patch.status === "string") {
    nextPatch["process.status"] = statusKeyToProcessStatus(patch.status);
    nextPatch["process.lastStatusChangeAt"] = Timestamp.fromDate(new Date());
  }

  return nextPatch;
}

