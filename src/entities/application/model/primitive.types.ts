export type ProcessStatus =
  | "SAVED"
  | "PLANNED"
  | "APPLIED"
  | "VIEWED"
  | "INTERVIEW_1"
  | "INTERVIEW_2"
  | "TEST_TASK"
  | "OFFER"
  | "REJECTED"
  | "NO_RESPONSE"
  /** Candidate withdrew their own application (distinct from "company rejected"). */
  | "WITHDREW";

export type ProcessStage =
  | "ACTIVE"
  | "INTERVIEW"
  | "OFFER"
  | "HIRED"
  | "REJECTED"
  | "NO_RESPONSE"
  | "ARCHIVED";

export type AppliedVia =
  | "company_site"
  | "linkedin"
  | "indeed"
  | "stepstone"
  | "email"
  | "referral"
  | "other";

export type HistoryType =
  | "STATUS_CHANGE"
  | "FIELD_CHANGE"
  | "COMMENT"
  | "SYSTEM";

export type HistoryActor = "user" | "system";

export type RemotePreference = "REMOTE_ONLY" | "HYBRID_OK" | "ON_SITE_OK";
export type WorkMode = "REMOTE" | "HYBRID" | "ON_SITE";
export type EmploymentType = "FULL_TIME" | "PART_TIME" | "CONTRACT";

export type FeedbackType =
  | "HR_REPLY"
  | "TECH_FEEDBACK"
  | "SELF_NOTE"
  | "FOLLOW_UP"
  | "INTERVIEW_NOTE"
  | "REJECTION_REASON";

export type Sentiment = "positive" | "neutral" | "negative";

export type RejectionReasonCode =
  | "SKILLS_GAP"
  | "SENIORITY_MISMATCH"
  | "LANGUAGE_LEVEL"
  | "SALARY_MISMATCH"
  | "LOCATION_REMOTE"
  | "NO_RESPONSE"
  | "CULTURE_FIT"
  | "INTERNAL_CANDIDATE"
  | "OTHER";
