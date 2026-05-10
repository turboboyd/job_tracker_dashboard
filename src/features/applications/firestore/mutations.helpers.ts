import { doc, getDoc, setDoc, type Firestore } from "firebase/firestore";

import { nowTs } from "./lib/time";
import type {
  ApplicationDoc,
  ProcessStage,
  ProcessStatus,
} from "./types";

export async function ensureManualLoopDoc(
  db: Firestore,
  userId: string,
  loopId: string,
): Promise<void> {
  const manualLoopRef = doc(db, "users", userId, "loops", loopId);
  const manualLoopSnap = await getDoc(manualLoopRef);

  if (manualLoopSnap.exists()) {
    return;
  }

  const createdAt = nowTs();
  await setDoc(manualLoopRef, {
    name: "Manual",
    titles: [],
    location: "",
    radiusKm: 0,
    remoteMode: "manual",
    platforms: [],
    filters: {},
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdAtTs: createdAt,
    updatedAtTs: createdAt,
  });
}

export function mapLegacyStatusToStageSubStatus(
  status: ProcessStatus,
): { stage: ProcessStage; subStatus: string } {
  switch (status) {
    case "SAVED":
      return { stage: "ACTIVE", subStatus: "SAVED" };
    case "APPLIED":
      return { stage: "ACTIVE", subStatus: "APPLIED" };
    case "INTERVIEW_1":
      return { stage: "INTERVIEW", subStatus: "HR_CALL_SCHEDULED" };
    case "OFFER":
      return { stage: "OFFER", subStatus: "OFFER_RECEIVED" };
    case "REJECTED":
      return { stage: "REJECTED", subStatus: "REJECTED_PRE_INTERVIEW" };
    case "NO_RESPONSE":
      return { stage: "NO_RESPONSE", subStatus: "GHOSTING" };
    case "WITHDREW":
      // Candidate withdrew their own application — archived, not rejected.
      return { stage: "ARCHIVED", subStatus: "WITHDREW_BEFORE_START" };
    default:
      return { stage: "ACTIVE", subStatus: "SAVED" };
  }
}

export function selectGhostingCandidates(
  rows: { id: string; data: ApplicationDoc }[],
  now: number,
  days: number,
): { id: string; data: ApplicationDoc }[] {
  const maxAgeMs = days * 24 * 60 * 60 * 1000;

  return rows.filter(({ data }) => {
    if (data.archived) return false;
    if (data.process.status === "NO_RESPONSE") return false;

    const appliedAt = data.process.appliedAt;
    if (!appliedAt) return false;

    return appliedAt.toDate().getTime() <= now - maxAgeMs;
  });
}
