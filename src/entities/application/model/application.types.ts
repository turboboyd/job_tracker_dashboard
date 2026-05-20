import type { Timestamp } from "firebase/firestore";

import type { MatchingBlock, PriorityBlock } from "./matching.types";
import type {
  AppliedVia,
  EmploymentType,
  ProcessStage,
  ProcessStatus,
  WorkMode,
} from "./primitive.types";

export interface ReminderEntry {
  /** Stable client-generated id (used for list rendering and removal) */
  id: string;
  at: Timestamp;
  text?: string;
}

export interface ApplicationDoc {
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  archived: boolean;
  isFavorite?: boolean;
  job: {
    companyName: string;
    companyId?: string;
    roleTitle: string;
    locationText?: string;
    vacancyUrl?: string;
    source?: string;
    postedAt?: Timestamp;
    salary?: { currency?: string; min?: number; max?: number };
    employmentType?: EmploymentType;
    workMode?: WorkMode;
  };
  process: {
    status: ProcessStatus;
    stage?: ProcessStage;
    subStatus?: string;
    lastStatusChangeAt: Timestamp;
    appliedAt?: Timestamp;
    appliedVia?: AppliedVia;
    nextActionAt?: Timestamp;
    nextActionText?: string;
    /**
     * All planned reminders for this application, sorted by `at` ASC.
     * `nextActionAt`/`nextActionText` mirror the earliest one for backward compat.
     */
    reminders?: ReminderEntry[];
    contactAttempts: number;
    lastContactAt?: Timestamp;
    lastFollowUpAt?: Timestamp;
    followUpLevel: number;
    needsFollowUp: boolean;
    followUpDueAt?: Timestamp;
    needsReapplySuggestion: boolean;
    reapplyEligibleAt?: Timestamp;
    reapplyReason?: string;
  };
  notes?: {
    currentNote?: string;
    tags?: string[];
  };
  vacancy?: {
    rawDescription?: string;
    roleFingerprint?: string;
  };
  loopLinkage?: {
    loopId: string;
    platform?: string;
    matchedAt?: Timestamp;
    source?: "loop" | "manual" | "import";
    legacyMatchId?: string;
  };
  hasLoop?: boolean;
  /** Backend-derived age metrics. Preserved from ApplicationRead for future UI labels. */
  daysInPipeline?: number;
  daysSinceApplied?: number;
  daysInCurrentStatus?: number;
  tags?: string[];
  matching?: MatchingBlock;
  priority?: PriorityBlock;
  cvLinkage?: { cvVersionId?: string; profileVersionId?: string };
  integrations?: {
    googleCalendar?: {
      actionAtMs?: number;
      errorMessage?: string;
      eventId?: string;
      htmlLink?: string;
      lastErrorAt?: Timestamp;
      lastSyncedAt?: Timestamp;
    };
  };
}
