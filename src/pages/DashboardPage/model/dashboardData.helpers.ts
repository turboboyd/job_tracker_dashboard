// Re-export shim: the dashboard data closure now lives in src/features/dashboard.
// Kept here so DashboardPage-internal consumers can keep importing from ./model.
export {
  fetchDashboardHistoryMap,
  filterDashboardMatchesByLoopsFilter,
  getDashboardDataErrorMessage,
  parseDashboardLoopsFilter,
  readDashboardLoopsFilter,
  writeDashboardLoopsFilter,
} from "src/features/dashboard";
