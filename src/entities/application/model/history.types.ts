import type { Timestamp } from "firebase/firestore";

import type {
  FeedbackType,
  HistoryActor,
  HistoryType,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
} from "./primitive.types";

export interface HistoryEventDoc {
  createdAt?: Timestamp;
  actor: HistoryActor;
  type: HistoryType;
  fromStatus?: ProcessStatus;
  toStatus?: ProcessStatus;
  fieldPath?: string;
  oldValue?: unknown;
  newValue?: unknown;
  comment?: string;
  feedbackType?: FeedbackType;
  sentiment?: Sentiment;
  rejectionReasonCode?: RejectionReasonCode;
  /**
   * Optional correlation id to group multiple events that originated from a
   * single user action (e.g. an outcome wizard run that emits both a
   * STATUS_CHANGE and a COMMENT). Renderers can collapse adjacent events
   * with the same id into one block.
   */
  correlationId?: string;
}
