export type {
  ApplicationDoc,
  HistoryEventDoc,
  ProcessStage,
  ProcessStatus,
  ReminderEntry,
} from "./firestore/types";

export {
  createApplication,
  getApplication,
  getApplicationHistory,
  updateApplicationWithHistory,
  changeStatus,
  addComment,
  scheduleNextAction,
  setReminders,
  ensureUserDoc,
  autoMarkGhosting,
  queryAllActiveApplications,
  queryFollowUpsDue,
  queryPipelineByStatus,
  queryTodayTopPriority,
  subscribeAllActiveApplications,
  subscribeFollowUpsDue,
  subscribePipelineByStatus,
  subscribeTodayTopPriority,
} from "./firestore/api";

export { createApplicationsRepo } from "./repo";
export type { ApplicationsRepo } from "./repo";

export { createRestApplicationGateway } from "./rest/gateway";
