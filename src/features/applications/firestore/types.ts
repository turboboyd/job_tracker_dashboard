/**
 * Thin compatibility facade.
 *
 * Internal firestore modules should prefer narrower boundaries:
 * - ./domain.types
 * - ./documents.types
 * - ./patch.types
 *
 * External consumers can continue importing from ./types during staged refactor.
 */
export type {
  AppliedVia,
  EmploymentType,
  FeedbackType,
  HistoryActor,
  HistoryType,
  MatchingBlock,
  MatchingBreakdown,
  MatchingDecision,
  PriorityBlock,
  ProcessStage,
  ProcessStatus,
  RejectionReasonCode,
  RemotePreference,
  Sentiment,
  WorkMode,
} from "./domain.types";

export type {
  ApplicationDoc,
  HistoryEventDoc,
  ReminderEntry,
  UserDoc,
  UserSkill,
} from "./documents.types";

export type {
  ApplicationPatchInput,
  DotPatch,
} from "./patch.types";
