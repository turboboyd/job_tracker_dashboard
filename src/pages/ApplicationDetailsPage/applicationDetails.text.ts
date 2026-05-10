import type { useTranslation } from "react-i18next";

type Translate = ReturnType<typeof useTranslation>["t"];

export interface ApplicationDetailsText {
  actions: string;
  add: string;
  addReminder: string;
  back: string;
  calendarLink: string;
  changeStatus: string;
  comment: string;
  commentPlaceholder: string;
  company: string;
  computedAt: string;
  confidence: string;
  decision: string;
  editNextAction: string;
  emptyValue: string;
  exportPlan: string;
  fieldPrefix: string;
  followUp: string;
  gaps: string;
  history: string;
  historyCommentTitle: string;
  historyFilterAll: string;
  historyFilterComments: string;
  historyFilterStatuses: string;
  historyStatusPrefix: string;
  historySystemTitle: string;
  loading: string;
  matched: string;
  matching: string;
  no: string;
  noHistory: string;
  noMatching: string;
  notFound: string;
  nextAction: string;
  nextActionCalloutCta: string;
  nextActionCalloutEmpty: string;
  nextActionCalloutPlanned: string;
  nextActionDate: string;
  nextActionEmpty: string;
  nextActionNote: string;
  nextActionNotePlaceholder: string;
  nextActionTime: string;
  openVacancy: string;
  plan: string;
  planEmpty: string;
  planAddAria: string;
  planEditAria: string;
  planDeleteAria: string;
  priority: string;
  reapply: string;
  removeReminder: string;
  reminderModalTitleAdd: string;
  reminderModalTitleEdit: string;
  reminderModalSubtitle: string;
  reminderModalPresetsLabel: string;
  reminderModalCancel: string;
  reminderModalSave: string;
  reminderPresetTomorrow: string;
  reminderPresetIn3Days: string;
  reminderPresetIn1Week: string;
  reminderPresetIn2Weeks: string;
  reminderPresetIn1Month: string;
  reminderErrorMissingDate: string;
  reminderErrorInvalidFormat: string;
  reminderErrorInPast: string;
  reminderActionDone: string;
  reminderActionSnooze: string;
  reminderSnoozeIn1Hour: string;
  reminderSnoozeIn3Hours: string;
  reminderSnoozeTomorrow: string;
  reminderOverdue: string;
  reminderHistoryDoneTitle: string;

  // Outcome wizard
  outcomeWizardTitle: string;
  outcomeWizardSubtitle: string;
  outcomeWizardStep1Hint: string;
  outcomeWizardCalled: string;
  outcomeWizardNoAnswer: string;
  outcomeWizardRejected: string;
  outcomeWizardBack: string;
  outcomeWizardCommit: string;
  outcomeWizardCommentLabel: string;
  outcomeWizardCommentPlaceholder: string;
  outcomeWizardFollowUpLabel: string;

  // Outcome option labels & default comments
  outcomeNoAnswerNoResponseLabel: string;
  outcomeNoAnswerNoResponseComment: string;
  outcomeNoAnswerBusyLabel: string;
  outcomeNoAnswerBusyComment: string;
  outcomeNoAnswerVoicemailLabel: string;
  outcomeNoAnswerVoicemailComment: string;
  outcomeNoAnswerWrongNumberLabel: string;
  outcomeNoAnswerWrongNumberComment: string;
  outcomeCalledInterviewLabel: string;
  outcomeCalledInterviewComment: string;
  outcomeCalledSendDocsLabel: string;
  outcomeCalledSendDocsComment: string;
  outcomeCalledCallbackLaterLabel: string;
  outcomeCalledCallbackLaterComment: string;
  outcomeCalledTheyWillCallLabel: string;
  outcomeCalledTheyWillCallComment: string;
  outcomeCalledWithdrawLabel: string;
  outcomeCalledWithdrawComment: string;
  outcomeCalledCompanyRejectedLabel: string;
  outcomeCalledCompanyRejectedComment: string;
  outcomeRejectedLevelLabel: string;
  outcomeRejectedLevelComment: string;
  outcomeRejectedClosedLabel: string;
  outcomeRejectedClosedComment: string;
  outcomeRejectedOtherCandidateLabel: string;
  outcomeRejectedOtherCandidateComment: string;
  outcomeRejectedNoExplanationLabel: string;
  outcomeRejectedNoExplanationComment: string;
  outcomeRejectedOtherLabel: string;
  outcomeRejectedOtherComment: string;
  outcomeCustomLabel: string;
  outcomeCustomComment: string;

  // Follow-up note presets
  outcomeFollowUpNoteCallback: string;
  outcomeFollowUpNoteSendDocs: string;
  outcomeFollowUpNoteInterview: string;
  outcomeFollowUpNoteWaitForCallback: string;

  // Contact picker (placeholder for now)
  outcomeContactLabel: string;
  outcomeContactNone: string;
  outcomeContactPickHint: string;

  // Manual follow-up date presets
  outcomeManualPresetTomorrow: string;
  outcomeManualPresetIn2Days: string;
  outcomeManualPresetIn1Week: string;
  outcomeManualPresetCustom: string;
  role: string;
  savePlan: string;
  source: string;
  status: string;
  summary: string;
  tabContacts: string;
  tabHistory: string;
  tabOverview: string;
  tabPlan: string;
  titleFallback: string;
  yes: string;
}

export function createApplicationDetailsText(t: Translate): ApplicationDetailsText {
  return {
    actions: t("applicationDetails.actions", { defaultValue: "Actions" }),
    add: t("applicationDetails.add", { defaultValue: "Add" }),
    addReminder: t("applicationDetails.addReminder", {
      defaultValue: "Add reminder",
    }),
    back: t("applicationDetails.back", {
      defaultValue: "Back to applications",
    }),
    calendarLink: t("applicationDetails.calendarLink", {
      defaultValue: "Application link",
    }),
    changeStatus: t("applicationDetails.changeStatus", {
      defaultValue: "Change status",
    }),
    comment: t("applicationDetails.comment", {
      defaultValue: "Add comment",
    }),
    commentPlaceholder: t("applicationDetails.commentPh", {
      defaultValue: "Write a short note...",
    }),
    company: t("applicationDetails.company", { defaultValue: "Company" }),
    computedAt: t("applicationDetails.computedAt", {
      defaultValue: "Computed",
    }),
    confidence: t("applicationDetails.confidence", {
      defaultValue: "Confidence",
    }),
    decision: t("applicationDetails.decision", {
      defaultValue: "Decision",
    }),
    editNextAction: t("applicationDetails.editNextAction", {
      defaultValue: "Edit",
    }),
    emptyValue: "-",
    exportPlan: t("applicationDetails.exportPlan", {
      defaultValue: "Export to calendar",
    }),
    fieldPrefix: t("applicationDetails.fieldPrefix", {
      defaultValue: "Field",
    }),
    followUp: t("applicationDetails.followup", {
      defaultValue: "Follow-up",
    }),
    gaps: t("applicationDetails.gaps", { defaultValue: "Gaps" }),
    history: t("applicationDetails.history", { defaultValue: "History" }),
    historyCommentTitle: t("applicationDetails.historyCommentTitle", {
      defaultValue: "Comment",
    }),
    historyFilterAll: t("applicationDetails.historyFilter.all", {
      defaultValue: "All",
    }),
    historyFilterComments: t("applicationDetails.historyFilter.comments", {
      defaultValue: "Comments",
    }),
    historyFilterStatuses: t("applicationDetails.historyFilter.statuses", {
      defaultValue: "Statuses",
    }),
    historyStatusPrefix: t("applicationDetails.historyStatusPrefix", {
      defaultValue: "Status",
    }),
    historySystemTitle: t("applicationDetails.historySystemTitle", {
      defaultValue: "System",
    }),
    loading: t("applicationDetails.loading", { defaultValue: "Loading..." }),
    matched: t("applicationDetails.matched", { defaultValue: "Matched" }),
    matching: t("applicationDetails.matching", { defaultValue: "Matching" }),
    no: t("applicationDetails.no", { defaultValue: "No" }),
    noHistory: t("applicationDetails.noHistory", {
      defaultValue: "No history yet.",
    }),
    noMatching: t("applicationDetails.noMatching", {
      defaultValue: "No matching data yet. Add description or skills.",
    }),
    notFound: t("applicationDetails.notFound", {
      defaultValue: "Not found",
    }),
    nextAction: t("applicationDetails.nextAction", {
      defaultValue: "Next action",
    }),
    nextActionCalloutCta: t("applicationDetails.nextActionCalloutCta", {
      defaultValue: "Schedule next action",
    }),
    nextActionCalloutEmpty: t("applicationDetails.nextActionCalloutEmpty", {
      defaultValue: "What's next? Plan a follow-up so you don't lose this lead.",
    }),
    nextActionCalloutPlanned: t("applicationDetails.nextActionCalloutPlanned", {
      defaultValue: "Up next",
    }),
    nextActionDate: t("applicationDetails.nextActionDate", {
      defaultValue: "Date",
    }),
    nextActionEmpty: t("applicationDetails.nextActionEmpty", {
      defaultValue: "No planned action",
    }),
    nextActionNote: t("applicationDetails.nextActionNote", {
      defaultValue: "Reason",
    }),
    nextActionNotePlaceholder: t("applicationDetails.nextActionNotePh", {
      defaultValue: "Call, follow up, send documents...",
    }),
    nextActionTime: t("applicationDetails.nextActionTime", {
      defaultValue: "Time",
    }),
    openVacancy: t("applicationDetails.openVacancy", {
      defaultValue: "Open vacancy",
    }),
    plan: t("applicationDetails.plan", { defaultValue: "Plan" }),
    planEmpty: t("applicationDetails.planEmpty", {
      defaultValue: "No reminders yet. Add one to schedule a follow-up.",
    }),
    planAddAria: t("applicationDetails.planAddAria", {
      defaultValue: "Add reminder",
    }),
    planEditAria: t("applicationDetails.planEditAria", {
      defaultValue: "Edit reminder",
    }),
    planDeleteAria: t("applicationDetails.planDeleteAria", {
      defaultValue: "Delete reminder",
    }),
    priority: t("applicationDetails.priority", { defaultValue: "Priority" }),
    reapply: t("applicationDetails.reapply", {
      defaultValue: "Re-apply",
    }),
    removeReminder: t("applicationDetails.removeReminder", {
      defaultValue: "Remove reminder",
    }),
    reminderModalTitleAdd: t("applicationDetails.reminderModal.titleAdd", {
      defaultValue: "Add reminder",
    }),
    reminderModalTitleEdit: t("applicationDetails.reminderModal.titleEdit", {
      defaultValue: "Edit reminder",
    }),
    reminderModalSubtitle: t("applicationDetails.reminderModal.subtitle", {
      defaultValue: "Pick when to follow up. We'll keep it close at hand.",
    }),
    reminderModalPresetsLabel: t("applicationDetails.reminderModal.presetsLabel", {
      defaultValue: "Quick choice",
    }),
    reminderModalCancel: t("applicationDetails.reminderModal.cancel", {
      defaultValue: "Cancel",
    }),
    reminderModalSave: t("applicationDetails.reminderModal.save", {
      defaultValue: "Save",
    }),
    reminderPresetTomorrow: t("applicationDetails.reminderModal.preset.tomorrow", {
      defaultValue: "Tomorrow",
    }),
    reminderPresetIn3Days: t("applicationDetails.reminderModal.preset.in_3_days", {
      defaultValue: "In 3 days",
    }),
    reminderPresetIn1Week: t("applicationDetails.reminderModal.preset.in_1_week", {
      defaultValue: "In 1 week",
    }),
    reminderPresetIn2Weeks: t("applicationDetails.reminderModal.preset.in_2_weeks", {
      defaultValue: "In 2 weeks",
    }),
    reminderPresetIn1Month: t("applicationDetails.reminderModal.preset.in_1_month", {
      defaultValue: "In 1 month",
    }),
    reminderErrorMissingDate: t("applicationDetails.reminderModal.error.missing_date", {
      defaultValue: "Please pick a date.",
    }),
    reminderErrorInvalidFormat: t("applicationDetails.reminderModal.error.invalid_format", {
      defaultValue: "Date or time format is invalid.",
    }),
    reminderErrorInPast: t("applicationDetails.reminderModal.error.in_past", {
      defaultValue: "Reminder must be in the future.",
    }),
    reminderActionDone: t("applicationDetails.reminderActions.done", {
      defaultValue: "Done",
    }),
    reminderActionSnooze: t("applicationDetails.reminderActions.snooze", {
      defaultValue: "Snooze",
    }),
    reminderSnoozeIn1Hour: t("applicationDetails.reminderActions.in1Hour", {
      defaultValue: "In 1 hour",
    }),
    reminderSnoozeIn3Hours: t("applicationDetails.reminderActions.in3Hours", {
      defaultValue: "In 3 hours",
    }),
    reminderSnoozeTomorrow: t("applicationDetails.reminderActions.tomorrow", {
      defaultValue: "Tomorrow 09:00",
    }),
    reminderOverdue: t("applicationDetails.reminderActions.overdue", {
      defaultValue: "Overdue",
    }),
    reminderHistoryDoneTitle: t("applicationDetails.reminderActions.historyDone", {
      defaultValue: "Reminder completed",
    }),

    // Outcome wizard
    outcomeWizardTitle: t("applicationDetails.outcome.title", {
      defaultValue: "What happened?",
    }),
    outcomeWizardSubtitle: t("applicationDetails.outcome.subtitle", {
      defaultValue: "Log the outcome and schedule the next step.",
    }),
    outcomeWizardStep1Hint: t("applicationDetails.outcome.step1Hint", {
      defaultValue: "Pick the outcome of this reminder.",
    }),
    outcomeWizardCalled: t("applicationDetails.outcome.called", {
      defaultValue: "Reached / talked",
    }),
    outcomeWizardNoAnswer: t("applicationDetails.outcome.noAnswer", {
      defaultValue: "No answer",
    }),
    outcomeWizardRejected: t("applicationDetails.outcome.rejected", {
      defaultValue: "Rejected",
    }),
    outcomeWizardBack: t("applicationDetails.outcome.back", {
      defaultValue: "Back",
    }),
    outcomeWizardCommit: t("applicationDetails.outcome.commit", {
      defaultValue: "Save outcome",
    }),
    outcomeWizardCommentLabel: t("applicationDetails.outcome.commentLabel", {
      defaultValue: "Comment for history",
    }),
    outcomeWizardCommentPlaceholder: t("applicationDetails.outcome.commentPlaceholder", {
      defaultValue: "Add details (optional)",
    }),
    outcomeWizardFollowUpLabel: t("applicationDetails.outcome.followUpLabel", {
      defaultValue: "Next reminder",
    }),

    // No-answer
    outcomeNoAnswerNoResponseLabel: t("applicationDetails.outcome.noAnswer_noResponse_label", {
      defaultValue: "No response",
    }),
    outcomeNoAnswerNoResponseComment: t("applicationDetails.outcome.noAnswer_noResponse_comment", {
      defaultValue: "No response when called",
    }),
    outcomeNoAnswerBusyLabel: t("applicationDetails.outcome.noAnswer_busy_label", {
      defaultValue: "Busy",
    }),
    outcomeNoAnswerBusyComment: t("applicationDetails.outcome.noAnswer_busy_comment", {
      defaultValue: "Line was busy",
    }),
    outcomeNoAnswerVoicemailLabel: t("applicationDetails.outcome.noAnswer_voicemail_label", {
      defaultValue: "Left a voicemail",
    }),
    outcomeNoAnswerVoicemailComment: t("applicationDetails.outcome.noAnswer_voicemail_comment", {
      defaultValue: "Left a voicemail",
    }),
    outcomeNoAnswerWrongNumberLabel: t("applicationDetails.outcome.noAnswer_wrongNumber_label", {
      defaultValue: "Wrong number",
    }),
    outcomeNoAnswerWrongNumberComment: t("applicationDetails.outcome.noAnswer_wrongNumber_comment", {
      defaultValue: "Wrong number",
    }),

    // Called
    outcomeCalledInterviewLabel: t("applicationDetails.outcome.called_interview_label", {
      defaultValue: "Interview agreed",
    }),
    outcomeCalledInterviewComment: t("applicationDetails.outcome.called_interview_comment", {
      defaultValue: "Agreed on an interview",
    }),
    outcomeCalledSendDocsLabel: t("applicationDetails.outcome.called_sendDocs_label", {
      defaultValue: "Send documents",
    }),
    outcomeCalledSendDocsComment: t("applicationDetails.outcome.called_sendDocs_comment", {
      defaultValue: "They asked to send documents",
    }),
    outcomeCalledCallbackLaterLabel: t("applicationDetails.outcome.called_callbackLater_label", {
      defaultValue: "They asked to call back",
    }),
    outcomeCalledCallbackLaterComment: t("applicationDetails.outcome.called_callbackLater_comment", {
      defaultValue: "They asked to call back later",
    }),
    outcomeCalledTheyWillCallLabel: t("applicationDetails.outcome.called_theyWillCall_label", {
      defaultValue: "They said they'll call back",
    }),
    outcomeCalledTheyWillCallComment: t("applicationDetails.outcome.called_theyWillCall_comment", {
      defaultValue: "They said they'll get back to me",
    }),
    outcomeCalledWithdrawLabel: t("applicationDetails.outcome.called_withdraw_label", {
      defaultValue: "Withdraw my application",
    }),
    outcomeCalledWithdrawComment: t("applicationDetails.outcome.called_withdraw_comment", {
      defaultValue: "Withdrew my application",
    }),
    outcomeCalledCompanyRejectedLabel: t("applicationDetails.outcome.called_companyRejected_label", {
      defaultValue: "Company rejected me on the call",
    }),
    outcomeCalledCompanyRejectedComment: t("applicationDetails.outcome.called_companyRejected_comment", {
      defaultValue: "Company rejected me on the call",
    }),

    // Rejected
    outcomeRejectedLevelLabel: t("applicationDetails.outcome.rejected_level_label", {
      defaultValue: "Level mismatch",
    }),
    outcomeRejectedLevelComment: t("applicationDetails.outcome.rejected_level_comment", {
      defaultValue: "Rejected — level mismatch",
    }),
    outcomeRejectedClosedLabel: t("applicationDetails.outcome.rejected_closed_label", {
      defaultValue: "Position closed",
    }),
    outcomeRejectedClosedComment: t("applicationDetails.outcome.rejected_closed_comment", {
      defaultValue: "Rejected — position closed",
    }),
    outcomeRejectedOtherCandidateLabel: t("applicationDetails.outcome.rejected_otherCandidate_label", {
      defaultValue: "Found another candidate",
    }),
    outcomeRejectedOtherCandidateComment: t("applicationDetails.outcome.rejected_otherCandidate_comment", {
      defaultValue: "Rejected — found another candidate",
    }),
    outcomeRejectedNoExplanationLabel: t("applicationDetails.outcome.rejected_noExplanation_label", {
      defaultValue: "No explanation",
    }),
    outcomeRejectedNoExplanationComment: t("applicationDetails.outcome.rejected_noExplanation_comment", {
      defaultValue: "Rejected — no explanation given",
    }),
    outcomeRejectedOtherLabel: t("applicationDetails.outcome.rejected_other_label", {
      defaultValue: "Other",
    }),
    outcomeRejectedOtherComment: t("applicationDetails.outcome.rejected_other_comment", {
      defaultValue: "Rejected",
    }),

    outcomeCustomLabel: t("applicationDetails.outcome.custom_label", {
      defaultValue: "Custom",
    }),
    outcomeCustomComment: t("applicationDetails.outcome.custom_comment", {
      defaultValue: "Outcome",
    }),

    // Follow-up note presets
    outcomeFollowUpNoteCallback: t("applicationDetails.outcome.followUp_callback", {
      defaultValue: "Call back",
    }),
    outcomeFollowUpNoteSendDocs: t("applicationDetails.outcome.followUp_sendDocs", {
      defaultValue: "Send documents",
    }),
    outcomeFollowUpNoteInterview: t("applicationDetails.outcome.followUp_interview", {
      defaultValue: "Prepare for interview",
    }),
    outcomeFollowUpNoteWaitForCallback: t("applicationDetails.outcome.followUp_waitForCallback", {
      defaultValue: "Follow up if no callback",
    }),

    // Contact picker (placeholder)
    outcomeContactLabel: t("applicationDetails.outcome.contact_label", {
      defaultValue: "Contact",
    }),
    outcomeContactNone: t("applicationDetails.outcome.contact_none", {
      defaultValue: "Not specified",
    }),
    outcomeContactPickHint: t("applicationDetails.outcome.contact_pickHint", {
      defaultValue: "Pick a contact (optional)",
    }),

    outcomeManualPresetTomorrow: t("applicationDetails.outcome.manualPreset.tomorrow", {
      defaultValue: "Tomorrow",
    }),
    outcomeManualPresetIn2Days: t("applicationDetails.outcome.manualPreset.in_2_days", {
      defaultValue: "In 2 days",
    }),
    outcomeManualPresetIn1Week: t("applicationDetails.outcome.manualPreset.in_1_week", {
      defaultValue: "In 1 week",
    }),
    outcomeManualPresetCustom: t("applicationDetails.outcome.manualPreset.custom", {
      defaultValue: "Custom date",
    }),
    role: t("applicationDetails.role", { defaultValue: "Role" }),
    savePlan: t("applicationDetails.savePlan", { defaultValue: "Save plan" }),
    source: t("applicationDetails.source", { defaultValue: "Source" }),
    status: t("applicationDetails.status", { defaultValue: "Status" }),
    summary: t("applicationDetails.summary", { defaultValue: "Summary" }),
    tabContacts: t("applicationDetails.tabContacts", {
      defaultValue: "Contacts",
    }),
    tabHistory: t("applicationDetails.tabHistory", {
      defaultValue: "History",
    }),
    tabOverview: t("applicationDetails.tabOverview", {
      defaultValue: "Overview",
    }),
    tabPlan: t("applicationDetails.tabPlan", {
      defaultValue: "Plan & activity",
    }),
    titleFallback: t("applicationDetails.titleFallback", {
      defaultValue: "Application",
    }),
    yes: t("applicationDetails.yes", { defaultValue: "Yes" }),
  };
}
