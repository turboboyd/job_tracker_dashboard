import type { Firestore } from "firebase/firestore";
import { Timestamp, doc, writeBatch } from "firebase/firestore";

import {
  attachCreatedAt,
  buildApplicationCreatedEvent,
  buildCommentEvent,
  buildStatusChangeEvent,
  queueHistoryEvents,
} from "./history";
import { stripUndefinedDeep } from "./lib/sanitize";
import { nowTs } from "./lib/time";
import {
  applyDerivedApplicationDoc,
  buildBaseApplicationDoc,
  buildDerivedUpdatePatch,
  buildStatusUpdatePatch,
  resolveEffectiveLoopId,
} from "./mutations.builders";
import { ensureManualLoopDoc } from "./mutations.helpers";
import type { CreateApplicationInput } from "./mutations.types";
import { getApplication } from "./queries";
import { applicationsColRef, applicationDocRef } from "./refs";
import type {
  ApplicationDoc,
  FeedbackType,
  HistoryEventDoc,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
} from "./types";
import { ensureUserDoc, getUserDoc } from "./user";

export { autoMarkGhosting } from "./mutations.ghosting";

async function getRequiredApplication(
  db: Firestore,
  userId: string,
  appId: string,
): Promise<ApplicationDoc> {
  const application = await getApplication(db, userId, appId);

  if (!application) {
    throw new Error(`Application ${appId} not found`);
  }

  return application;
}

/**
 * Create new application with initial history event (SYSTEM).
 * Also computes derived blocks (matching/priority/followup/reapply/fingerprint) on the client.
 */
export async function createApplication(
  db: Firestore,
  userId: string,
  input: CreateApplicationInput,
): Promise<string> {
  await ensureUserDoc(db, userId);

  const effectiveLoopId = resolveEffectiveLoopId(input.loopId);

  if (!input.loopId) {
    await ensureManualLoopDoc(db, userId, effectiveLoopId);
  }

  const appId = doc(applicationsColRef(db, userId)).id;
  const appRef = applicationDocRef(db, userId, appId);
  const createdAt = nowTs();
  const baseApplication = buildBaseApplicationDoc(userId, input, createdAt, effectiveLoopId);
  const user = await getUserDoc(db, userId);
  const application = applyDerivedApplicationDoc(user, baseApplication, createdAt);

  const batch = writeBatch(db);
  batch.set(appRef, stripUndefinedDeep(application));
  queueHistoryEvents(
    batch,
    db,
    userId,
    appId,
    attachCreatedAt([buildApplicationCreatedEvent()], createdAt),
  );

  await batch.commit();
  return appId;
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
  const current = await getRequiredApplication(db, userId, appId);
  const updatedAt = nowTs();
  const user = await getUserDoc(db, userId);
  const patchFinal = buildDerivedUpdatePatch(
    user,
    current,
    patch as Record<string, unknown>,
    updatedAt,
  );
  const events = attachCreatedAt(buildHistory(current), updatedAt);

  const batch = writeBatch(db);
  batch.update(applicationDocRef(db, userId, appId), patchFinal);
  queueHistoryEvents(batch, db, userId, appId, events);
  await batch.commit();
}

/**
 * Convenience: change status (writes STATUS_CHANGE + updates lastStatusChangeAt).
 *
 * Optional `correlationId` lets the caller group this event with other
 * events emitted from the same user action (see HistoryEventDoc.correlationId).
 */
export async function changeStatus(
  db: Firestore,
  userId: string,
  appId: string,
  toStatus: ProcessStatus,
  options?: { correlationId?: string },
): Promise<void> {
  const current = await getRequiredApplication(db, userId, appId);
  const patch = buildStatusUpdatePatch(current, toStatus, nowTs());

  await updateApplicationWithHistory(
    db,
    userId,
    appId,
    patch,
    () => [
      buildStatusChangeEvent({
        fromStatus: current.process.status,
        toStatus,
        ...(options?.correlationId ? { correlationId: options.correlationId } : {}),
      }),
    ],
  );
}

/**
 * Convenience: add comment history event (no application change needed except updatedAt).
 *
 * Optional `correlationId` groups this with sibling events from the same action.
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
    correlationId?: string;
  },
): Promise<void> {
  await updateApplicationWithHistory(db, userId, appId, {}, () => [
    buildCommentEvent(comment),
  ]);
}

export async function scheduleNextAction(
  db: Firestore,
  userId: string,
  appId: string,
  input: {
    actionAt: Date;
    text?: string;
  },
): Promise<void> {
  const actionAt = Timestamp.fromDate(input.actionAt);
  const actionText = input.text?.trim() ?? "";

  await updateApplicationWithHistory(
    db,
    userId,
    appId,
    {
      "process.nextActionAt": actionAt,
      "process.nextActionText": actionText,
    },
    (current) => [
      {
        actor: "user",
        type: "FIELD_CHANGE",
        fieldPath: "process.nextActionAt",
        oldValue: current.process.nextActionAt?.toDate().toISOString() ?? null,
        newValue: input.actionAt.toISOString(),
        comment: actionText,
      },
    ],
  );
}

interface ReminderInput {
  id?: string;
  at: Date;
  text?: string;
}

/**
 * Replace the full reminders list for an application.
 * Also syncs `nextActionAt`/`nextActionText` to the earliest reminder for backward compat.
 * Pass an empty array to clear all reminders.
 */
export async function setReminders(
  db: Firestore,
  userId: string,
  appId: string,
  reminders: ReminderInput[],
): Promise<void> {
  // Sort ASC by date and normalise
  const sorted = [...reminders]
    .filter((r) => r.at instanceof Date && !Number.isNaN(r.at.getTime()))
    .sort((a, b) => a.at.getTime() - b.at.getTime())
    .map((r, index) => ({
      id: r.id ?? `r-${Date.now()}-${index}`,
      at: Timestamp.fromDate(r.at),
      text: r.text?.trim() ?? "",
    }));

  const earliest = sorted[0];

  const patch: Record<string, unknown> = {
    "process.reminders": sorted,
  };

  if (earliest) {
    patch["process.nextActionAt"] = earliest.at;
    patch["process.nextActionText"] = earliest.text;
  } else {
    patch["process.nextActionAt"] = null;
    patch["process.nextActionText"] = "";
  }

  await updateApplicationWithHistory(db, userId, appId, patch, (current) => [
    {
      actor: "user",
      type: "FIELD_CHANGE",
      fieldPath: "process.reminders",
      oldValue: (current.process.reminders ?? []).length,
      newValue: sorted.length,
      comment: earliest
        ? `Next: ${earliest.at.toDate().toLocaleString()}${earliest.text ? ` — ${earliest.text}` : ""}`
        : "All reminders cleared",
    },
  ]);
}
