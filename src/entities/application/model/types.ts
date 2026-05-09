export type { ApplicationDoc, ReminderEntry } from "./application.types";
export type { HistoryEventDoc } from "./history.types";
export type {
  MatchingBlock,
  MatchingBreakdown,
  MatchingDecision,
  PriorityBlock,
} from "./matching.types";
export type {
  AppliedVia,
  EmploymentType,
  FeedbackType,
  HistoryActor,
  HistoryType,
  ProcessStage,
  ProcessStatus,
  RejectionReasonCode,
  RemotePreference,
  Sentiment,
  WorkMode,
} from "./primitive.types";
export type { UserDoc, UserSkill } from "./user.types";

export type DotPatch = Record<string, unknown>;
