import type { ProcessStatus } from "src/features/applications";

import type { ApplicationDetailsText } from "./applicationDetails.text";

/**
 * Outcomes of a "do reminder" action.
 *
 * Three top-level branches (called / no_answer / rejected) map to a small
 * set of quick options. Each option declares declaratively what should
 * happen on commit: a comment template, an optional status change, and an
 * optional follow-up reminder definition.
 *
 * The wizard reads this catalog and the controller executes it — keeps UI
 * dumb and lets us iterate the option list without touching the flow.
 */

export type OutcomeType = "called" | "no_answer" | "rejected";

export type FollowUpTiming =
  /** Schedule next reminder N minutes from now. */
  | { kind: "in_minutes"; minutes: number }
  /** Schedule next reminder N days from now at 09:00 local time. */
  | { kind: "in_days_at_9"; days: number }
  /** Open a manual date/time picker as a second step. */
  | { kind: "manual" }
  /** No follow-up reminder. */
  | { kind: "none" };

export interface OutcomeFollowUp {
  timing: FollowUpTiming;
  /** i18n key (already resolved at runtime) used as the new reminder note. */
  noteKey?: keyof ApplicationDetailsText;
}

export interface OutcomeOption {
  id: string;
  type: OutcomeType;
  /** i18n key resolved via ApplicationDetailsText. */
  labelKey: keyof ApplicationDetailsText;
  /** i18n key resolved via ApplicationDetailsText — used as the history comment body. */
  commentKey: keyof ApplicationDetailsText;
  /** Optional status change applied at commit. */
  statusChange?: ProcessStatus;
  /** Optional follow-up reminder created at commit. */
  followUp?: OutcomeFollowUp;
  /** When true the wizard exposes a free-form comment input the user must fill. */
  requireCustomComment?: boolean;
}

const HOUR = 60;

export const OUTCOME_OPTIONS: readonly OutcomeOption[] = [
  // ─── No answer / didn't reach ──────────────────────────────────────────
  {
    id: "no_response",
    type: "no_answer",
    labelKey: "outcomeNoAnswerNoResponseLabel",
    commentKey: "outcomeNoAnswerNoResponseComment",
    followUp: {
      timing: { kind: "in_days_at_9", days: 1 },
      noteKey: "outcomeFollowUpNoteCallback",
    },
  },
  {
    id: "busy",
    type: "no_answer",
    labelKey: "outcomeNoAnswerBusyLabel",
    commentKey: "outcomeNoAnswerBusyComment",
    followUp: {
      timing: { kind: "in_minutes", minutes: 3 * HOUR },
      noteKey: "outcomeFollowUpNoteCallback",
    },
  },
  {
    id: "voicemail",
    type: "no_answer",
    labelKey: "outcomeNoAnswerVoicemailLabel",
    commentKey: "outcomeNoAnswerVoicemailComment",
    // Person likely listens to voicemail same day — short callback window.
    followUp: {
      timing: { kind: "in_minutes", minutes: 3 * HOUR },
      noteKey: "outcomeFollowUpNoteCallback",
    },
  },
  {
    id: "wrong_number",
    type: "no_answer",
    labelKey: "outcomeNoAnswerWrongNumberLabel",
    commentKey: "outcomeNoAnswerWrongNumberComment",
    followUp: { timing: { kind: "none" } },
  },
  {
    id: "no_answer_custom",
    type: "no_answer",
    labelKey: "outcomeCustomLabel",
    commentKey: "outcomeCustomComment",
    followUp: { timing: { kind: "manual" } },
    requireCustomComment: true,
  },

  // ─── Reached / talked ──────────────────────────────────────────────────
  {
    id: "interview_agreed",
    type: "called",
    labelKey: "outcomeCalledInterviewLabel",
    commentKey: "outcomeCalledInterviewComment",
    statusChange: "INTERVIEW_1",
    followUp: {
      timing: { kind: "manual" },
      noteKey: "outcomeFollowUpNoteInterview",
    },
  },
  {
    id: "send_documents",
    type: "called",
    labelKey: "outcomeCalledSendDocsLabel",
    commentKey: "outcomeCalledSendDocsComment",
    followUp: {
      timing: { kind: "in_days_at_9", days: 1 },
      noteKey: "outcomeFollowUpNoteSendDocs",
    },
  },
  {
    id: "callback_later",
    type: "called",
    labelKey: "outcomeCalledCallbackLaterLabel",
    commentKey: "outcomeCalledCallbackLaterComment",
    followUp: {
      timing: { kind: "manual" },
      noteKey: "outcomeFollowUpNoteCallback",
    },
  },
  {
    id: "they_will_call",
    type: "called",
    labelKey: "outcomeCalledTheyWillCallLabel",
    commentKey: "outcomeCalledTheyWillCallComment",
    // 7 days felt too long — risk of losing momentum. 4 days = next business
    // week-ish, still gives them room.
    followUp: {
      timing: { kind: "in_days_at_9", days: 4 },
      noteKey: "outcomeFollowUpNoteWaitForCallback",
    },
  },
  {
    id: "withdraw",
    type: "called",
    // Renamed from "Not for me" to make intent crystal-clear: it's MY decision,
    // not the company rejecting me. Routed to WITHDREW status (separate enum).
    labelKey: "outcomeCalledWithdrawLabel",
    commentKey: "outcomeCalledWithdrawComment",
    statusChange: "WITHDREW",
    followUp: { timing: { kind: "none" } },
  },
  {
    id: "company_rejected_in_call",
    type: "called",
    // Company rejected me on the call (different from "rejected" branch which
    // covers async rejection like emails / no answer over time).
    labelKey: "outcomeCalledCompanyRejectedLabel",
    commentKey: "outcomeCalledCompanyRejectedComment",
    statusChange: "REJECTED",
    followUp: { timing: { kind: "none" } },
  },
  {
    id: "called_custom",
    type: "called",
    labelKey: "outcomeCustomLabel",
    commentKey: "outcomeCustomComment",
    followUp: { timing: { kind: "manual" } },
    requireCustomComment: true,
  },

  // ─── Rejected by employer ──────────────────────────────────────────────
  {
    id: "rejected_level_mismatch",
    type: "rejected",
    labelKey: "outcomeRejectedLevelLabel",
    commentKey: "outcomeRejectedLevelComment",
    statusChange: "REJECTED",
  },
  {
    id: "rejected_position_closed",
    type: "rejected",
    labelKey: "outcomeRejectedClosedLabel",
    commentKey: "outcomeRejectedClosedComment",
    statusChange: "REJECTED",
  },
  {
    id: "rejected_other_candidate",
    type: "rejected",
    labelKey: "outcomeRejectedOtherCandidateLabel",
    commentKey: "outcomeRejectedOtherCandidateComment",
    statusChange: "REJECTED",
  },
  {
    id: "rejected_no_explanation",
    type: "rejected",
    labelKey: "outcomeRejectedNoExplanationLabel",
    commentKey: "outcomeRejectedNoExplanationComment",
    statusChange: "REJECTED",
  },
  {
    id: "rejected_other",
    type: "rejected",
    labelKey: "outcomeRejectedOtherLabel",
    commentKey: "outcomeRejectedOtherComment",
    statusChange: "REJECTED",
    requireCustomComment: true,
  },
];

export function outcomesByType(type: OutcomeType): OutcomeOption[] {
  return OUTCOME_OPTIONS.filter((o) => o.type === type);
}

export function findOutcome(id: string): OutcomeOption | undefined {
  return OUTCOME_OPTIONS.find((o) => o.id === id);
}

/** Resolve a FollowUpTiming into a concrete Date relative to `now`. */
export function resolveFollowUpDate(
  timing: FollowUpTiming,
  now: Date = new Date(),
): Date | null {
  if (timing.kind === "none" || timing.kind === "manual") return null;

  const result = new Date(now);
  if (timing.kind === "in_minutes") {
    result.setMinutes(result.getMinutes() + timing.minutes);
    return result;
  }
  // in_days_at_9
  result.setDate(result.getDate() + timing.days);
  result.setHours(9, 0, 0, 0);
  return result;
}

