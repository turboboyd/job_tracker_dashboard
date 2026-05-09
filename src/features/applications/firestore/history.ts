import type { Firestore, Timestamp, writeBatch } from "firebase/firestore";
import { doc } from "firebase/firestore";

import { stripUndefinedDeep } from "./lib/sanitize";
import { historyColRef, historyDocRef } from "./refs";
import type {
  FeedbackType,
  HistoryActor,
  HistoryEventDoc,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
} from "./types";

export function buildApplicationCreatedEvent(): HistoryEventDoc {
  return {
    actor: "system",
    type: "SYSTEM",
    comment: "Application created",
  };
}

export function buildStatusChangeEvent(input: {
  actor?: HistoryActor;
  fromStatus?: ProcessStatus;
  toStatus: ProcessStatus;
  comment?: string;
  correlationId?: string;
}): HistoryEventDoc {
  return {
    actor: input.actor ?? "user",
    type: "STATUS_CHANGE",
    ...(input.fromStatus ? { fromStatus: input.fromStatus } : {}),
    toStatus: input.toStatus,
    ...(input.comment ? { comment: input.comment } : {}),
    ...(input.correlationId ? { correlationId: input.correlationId } : {}),
  };
}

export function buildAutoGhostingEvent(fromStatus: ProcessStatus): HistoryEventDoc {
  return buildStatusChangeEvent({
    actor: "system",
    fromStatus,
    toStatus: "NO_RESPONSE",
    comment: "Auto-marked as GHOSTING (no response > 30 days)",
  });
}

export function buildCommentEvent(comment: {
  text: string;
  feedbackType?: FeedbackType;
  sentiment?: Sentiment;
  rejectionReasonCode?: RejectionReasonCode;
  correlationId?: string;
}): HistoryEventDoc {
  return {
    actor: "user",
    type: "COMMENT",
    comment: comment.text,
    ...(comment.feedbackType ? { feedbackType: comment.feedbackType } : {}),
    ...(comment.sentiment ? { sentiment: comment.sentiment } : {}),
    ...(comment.rejectionReasonCode
      ? { rejectionReasonCode: comment.rejectionReasonCode }
      : {}),
    ...(comment.correlationId ? { correlationId: comment.correlationId } : {}),
  };
}

export function attachCreatedAt(events: HistoryEventDoc[], t: Timestamp) {
  return events.map((e) => ({ ...e, createdAt: e.createdAt ?? t }));
}

export function queueHistoryEvents(
  batch: ReturnType<typeof writeBatch>,
  db: Firestore,
  userId: string,
  appId: string,
  events: HistoryEventDoc[],
) {
  for (const ev of events) {
    const hId = doc(historyColRef(db, userId, appId)).id;
    const hRef = historyDocRef(db, userId, appId, hId);
    batch.set(hRef, stripUndefinedDeep(ev));
  }
}
