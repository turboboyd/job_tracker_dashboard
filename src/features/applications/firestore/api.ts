/* eslint-disable sonarjs/cognitive-complexity */
import type {
  Firestore} from "firebase/firestore";
import {
  Timestamp,
  doc,
  getDoc,
  getDocs,
  limit,
  setDoc,
  orderBy,
  query,
  where,
  writeBatch,
} from "firebase/firestore";

interface TimestampMillisLike { toMillis: () => number }
interface TimestampSecondsLike { seconds: number; nanoseconds?: number }

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTimestampMillisLike(value: unknown): value is TimestampMillisLike {
  return (
    isObject(value) &&
    typeof (value as unknown as TimestampMillisLike).toMillis === "function"
  );
}

function isTimestampSecondsLike(value: unknown): value is TimestampSecondsLike {
  return (
    isObject(value) &&
    typeof (value as unknown as TimestampSecondsLike).seconds === "number"
  );
}

function toMs(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") return value;
  if (value instanceof Date) return value.getTime();
  // Firestore Timestamp has toMillis(), but we duck-type to avoid instanceof issues.
  if (isTimestampMillisLike(value)) return value.toMillis();
  if (isTimestampSecondsLike(value)) return value.seconds * 1000;
  return 0;
}

import { buildDerivedPatch, computeDerived, withRoleFingerprint } from "./derived";
import { attachCreatedAt, queueHistoryEvents } from "./history";
import { applyDotPatch } from "./lib/patch";
import { stripUndefinedDeep } from "./lib/sanitize";
import { nowTs } from "./lib/time";
import { applicationsColRef, applicationDocRef, historyColRef, historyDocRef } from "./refs";
import type {
  ApplicationDoc,
  FeedbackType,
  HistoryEventDoc,
  ProcessStage,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
  WorkMode,
  EmploymentType,
  DotPatch,
} from "./types";
import { ensureUserDoc, getUserDoc } from "./user";

/**
 * Create new application with initial history event (SYSTEM).
 * Also computes derived blocks (matching/priority/followup/reapply/fingerprint) on the client.
 */
export async function createApplication(
  db: Firestore,
  userId: string,
  input: {
    companyName: string;
    roleTitle: string;
    vacancyUrl?: string;
    source?: string;
    status?: ProcessStatus; // default SAVED
    locationText?: string;
    workMode?: WorkMode;
    employmentType?: EmploymentType;
    tags?: string[];
    currentNote?: string;
    rawDescription?: string;

    // Optional loop linkage (unifies legacy loopMatches into applications)
    loopId?: string;
    loopPlatform?: string;
    loopMatchedAt?: Date;
    loopSource?: "loop" | "manual" | "import";
    legacyMatchId?: string;
  },
): Promise<string> {
  // Ensure user doc exists (Firestore-only mode)
  await ensureUserDoc(db, userId);


  // For UI consistency: Matches/Board expect applications to have loopLinkage.loopId.
  // If user creates an application manually, we attach it to a default "manual" loop.
  const effectiveLoopId = input.loopId ?? "manual";

  // Ensure the "manual" loop exists (best-effort).
  if (!input.loopId) {
    const manualLoopRef = doc(db, "users", userId, "loops", effectiveLoopId);
    const manualLoopSnap = await getDoc(manualLoopRef);
    if (!manualLoopSnap.exists()) {
      const t0 = nowTs();
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
        createdAtTs: t0,
        updatedAtTs: t0,
      });
    }
  }

  // Use Firestore-generated IDs
  const appId = doc(applicationsColRef(db, userId)).id;
  const appRef = applicationDocRef(db, userId, appId);

  const t = nowTs();
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

  const loopLinkage: ApplicationDoc["loopLinkage"] = {
    loopId: effectiveLoopId,
    ...(input.loopPlatform ? { platform: input.loopPlatform } : {}),
    ...(input.loopMatchedAt ? { matchedAt: Timestamp.fromDate(input.loopMatchedAt) } : {}),
    source: input.loopSource ?? (input.loopId ? "loop" : "manual"),
    ...(input.legacyMatchId ? { legacyMatchId: input.legacyMatchId } : {}),
  };

  const appDoc: ApplicationDoc = {
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

  // Derived fields
  const user = await getUserDoc(db, userId);
  const derived = computeDerived(user, appDoc, t);
  const derivedApp: ApplicationDoc = {
    ...withRoleFingerprint(appDoc, derived.roleFingerprint),
    ...(derived.matching ? { matching: derived.matching } : {}),
    process: {
      ...appDoc.process,
      ...derived.followUp,
      ...derived.reapply,
    },
    priority: derived.priority,
  };

  const batch = writeBatch(db);
  batch.set(appRef, stripUndefinedDeep(derivedApp));

  // Initial history event (SYSTEM)
  const hId = doc(historyColRef(db, userId, appId)).id;
  const hRef = historyDocRef(db, userId, appId, hId);
  const h: HistoryEventDoc = {
    createdAt: t,
    actor: "system",
    type: "SYSTEM",
    comment: "Application created",
  };
  batch.set(hRef, stripUndefinedDeep(h));

  await batch.commit();
  return appId;
}

/**
 * Fetch one application by id
 */
export async function getApplication(
  db: Firestore,
  userId: string,
  appId: string,
): Promise<ApplicationDoc | null> {
  const ref = applicationDocRef(db, userId, appId);
  const snap = await getDoc(ref);
  return snap.exists() ? (snap.data() as ApplicationDoc) : null;
}

/**
 * Load latest history (descending)
 */
export async function getApplicationHistory(
  db: Firestore,
  userId: string,
  appId: string,
  take = 50,
): Promise<{ id: string; data: HistoryEventDoc }[]> {
  const q = query(
    historyColRef(db, userId, appId),
    orderBy("createdAt", "desc"),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({
    id: d.id,
    data: d.data() as HistoryEventDoc,
  }));
}

/**
 * Update application with history event(s) in ONE batch.
 * Also recomputes derived fields (matching/priority/followup/reapply/fingerprint) client-side.
 *
 * NOTE: patch may include dot-path keys (e.g. "process.status").
 */
export async function updateApplicationWithHistory(
  db: Firestore,
  userId: string,
  appId: string,
  patch: Partial<ApplicationDoc> | Record<string, unknown>,
  buildHistory: (current: ApplicationDoc) => HistoryEventDoc[],
): Promise<void> {
  const appRef = applicationDocRef(db, userId, appId);
  const snap = await getDoc(appRef);
  if (!snap.exists()) throw new Error(`Application ${appId} not found`);

  const current = snap.data() as ApplicationDoc;
  const t = nowTs();

  const patchObj = patch as Record<string, unknown>;
  const patchRaw: DotPatch = { ...patchObj, updatedAt: t };
  const next = applyDotPatch(current as unknown as Record<string, unknown>, patchRaw) as unknown as ApplicationDoc;

  // Derived
  const user = await getUserDoc(db, userId);
  const derived = computeDerived(user, next, t);
  const patchFinal = stripUndefinedDeep({
    ...patchRaw,
    ...buildDerivedPatch(derived),
  });

  const events = attachCreatedAt(buildHistory(current), t);

  const batch = writeBatch(db);
  batch.update(appRef, patchFinal);
  queueHistoryEvents(batch, db, userId, appId, events);
  await batch.commit();
}

/**
 * Convenience: change status (writes STATUS_CHANGE + updates lastStatusChangeAt)
 */
export async function changeStatus(
  db: Firestore,
  userId: string,
  appId: string,
  toStatus: ProcessStatus,
): Promise<void> {
  // We need current doc to avoid resetting appliedAt repeatedly.
  const appRef = applicationDocRef(db, userId, appId);
  const snap = await getDoc(appRef);
  if (!snap.exists()) throw new Error(`Application ${appId} not found`);
  const current = snap.data() as ApplicationDoc;

  const t = nowTs();
  const patch: Record<string, unknown> = {
    "process.status": toStatus,
    "process.lastStatusChangeAt": t,
  };

  // Keep Board/Columns (stage-based) in sync with legacy status changes.
  // This is intentionally simple and backward-compatible: we always write
  // stage/subStatus alongside the legacy status.
  const mapLegacyToStageSub = (
    s: ProcessStatus,
  ): { stage: ProcessStage; subStatus: string } => {
    switch (s) {
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
      default:
        return { stage: "ACTIVE", subStatus: "SAVED" };
    }
  };

  const mapped = mapLegacyToStageSub(toStatus);
  patch["process.stage"] = mapped.stage;
  patch["process.subStatus"] = mapped.subStatus;

  // Track when an application was actually applied.
  if (toStatus === "APPLIED" && !current.process.appliedAt) {
    patch["process.appliedAt"] = t;
  }

  await updateApplicationWithHistory(
    db,
    userId,
    appId,
    patch,
    () => [
      {
        actor: "user",
        type: "STATUS_CHANGE",
        fromStatus: current.process.status,
        toStatus,
      },
    ],
  );
}

/**
 * Client-side automation: mark applications as NO_RESPONSE/GHOSTING
 * when appliedAt is older than `days` (default 30 days).
 *
 * This is a "best possible" automation without Cloud Functions: it runs when user opens lists.
 */
export async function autoMarkGhosting(
  db: Firestore,
  userId: string,
  rows: { id: string; data: ApplicationDoc }[],
  days = 30,
): Promise<number> {
  const ms = days * 24 * 60 * 60 * 1000;
  const now = Date.now();

  const toUpdate = rows.filter(({ data }) => {
    if (data.archived) return false;
    if (data.process.status === "NO_RESPONSE") return false;
    const appliedAt = data.process.appliedAt;
    if (!appliedAt) return false;
    const appliedMs = appliedAt.toDate().getTime();
    return appliedMs <= now - ms;
  });

  if (!toUpdate.length) return 0;

  const t = nowTs();
  const batch = writeBatch(db);

  for (const { id, data } of toUpdate) {
    const appRef = applicationDocRef(db, userId, id);
    const update: Record<string, unknown> = {
      "process.status": "NO_RESPONSE",
      "process.lastStatusChangeAt": t,
      "process.stage": "NO_RESPONSE",
      "process.subStatus": "GHOSTING",
      updatedAt: t,
    };
    batch.update(appRef, update);

    // History event
    const hId = doc(historyColRef(db, userId, id)).id;
    const hRef = historyDocRef(db, userId, id, hId);
    const h: HistoryEventDoc = {
      createdAt: t,
      actor: "system",
      type: "STATUS_CHANGE",
      fromStatus: data.process.status,
      toStatus: "NO_RESPONSE",
      comment: "Auto-marked as GHOSTING (no response > 30 days)",
    };
    batch.set(hRef, stripUndefinedDeep(h));
  }

  await batch.commit();
  return toUpdate.length;
}

/**
 * Convenience: add comment history event (no application change needed except updatedAt)
 */
export async function addComment(
  db: Firestore,
  userId: string,
  appId: string,
  comment: {
    text: string;
    feedbackType?: FeedbackType;
    sentiment?: Sentiment;
    rejectionReasonCode?: RejectionReasonCode;
  },
): Promise<void> {
  await updateApplicationWithHistory(db, userId, appId, {}, () => [
    {
      actor: "user",
      type: "COMMENT",
      comment: comment.text,
      ...(comment.feedbackType ? { feedbackType: comment.feedbackType } : {}),
      ...(comment.sentiment ? { sentiment: comment.sentiment } : {}),
      ...(comment.rejectionReasonCode
        ? { rejectionReasonCode: comment.rejectionReasonCode }
        : {}),
    },
  ]);
}

/**
 * Queries (Pipeline / Today / Follow-ups)
 */
export async function queryPipelineByStatus(
  db: Firestore,
  userId: string,
  status: ProcessStatus,
  take = 50,
): Promise<{ id: string; data: ApplicationDoc }[]> {
  // Avoid composite indexes by querying by status only and filtering/sorting client-side.
  // This keeps a fresh Firebase project usable without having to create indexes.
  const q = query(
    applicationsColRef(db, userId),
    where("process.status", "==", status),
    // oversample a bit because we filter archived client-side
    limit(take * 3),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as ApplicationDoc }))
    .filter((x) => !x.data.archived)
    .sort(
      (a, b) =>
        toMs(b.data.process.lastStatusChangeAt) - toMs(a.data.process.lastStatusChangeAt),
    )
    .slice(0, take);
}

export async function queryTodayTopPriority(
  db: Firestore,
  userId: string,
  take = 20,
): Promise<{ id: string; data: ApplicationDoc }[]> {
  // Avoid composite index by ordering only and filtering archived client-side.
  const q = query(
    applicationsColRef(db, userId),
    orderBy("priority.score", "desc"),
    limit(take * 3),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as ApplicationDoc }))
    .filter((x) => !x.data.archived)
    .slice(0, take);
}

export async function queryFollowUpsDue(
  db: Firestore,
  userId: string,
  take = 50,
): Promise<{ id: string; data: ApplicationDoc }[]> {
  // Avoid composite indexes by querying by needsFollowUp only and sorting client-side.
  const q = query(
    applicationsColRef(db, userId),
    where("process.needsFollowUp", "==", true),
    limit(take * 3),
  );
  const snap = await getDocs(q);
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as ApplicationDoc }))
    .filter((x) => !x.data.archived)
    .sort((a, b) => toMs(a.data.process.followUpDueAt) - toMs(b.data.process.followUpDueAt))
    .slice(0, take);
}

/**
 * Fetch all active (not archived) applications.
 *
 * NOTE:
 * - Intentionally does NOT use orderBy to avoid requiring additional composite indexes.
 * - Sort client-side if you need recency.
 */
export async function queryAllActiveApplications(
  db: Firestore,
  userId: string,
  take = 500,
): Promise<{ id: string; data: ApplicationDoc }[]> {
  const q = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    limit(take),
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, data: d.data() as ApplicationDoc }));
}

// Re-exported for backwards compatibility with older imports.
export { ensureUserDoc } from "./user";
