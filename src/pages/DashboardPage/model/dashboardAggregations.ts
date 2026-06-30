// Re-export shim: the dashboard data closure now lives in src/features/dashboard.
// Kept here so DashboardPage-internal consumers can keep importing from ./model.
export {
  buildDashboardChartMatches,
  buildDashboardMatches,
  buildDashboardPipelineSummary,
  buildDashboardPlanItems,
  buildRecentJobs,
  toMillis,
} from "src/features/dashboard";
export type {
  DashboardApplicationsRow,
  DashboardChartMatch,
  DashboardHistoryByAppId,
  DashboardPipelineSummary,
  DashboardPlanBucket,
  DashboardPlanItem,
  DashboardStatusHistoryItem,
  MatchLike,
} from "src/features/dashboard";
