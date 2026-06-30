/**
 * Pure dashboard data-layer types shared across the dashboard feature and the
 * pages that render it (DashboardPage, OptimizationPage).
 *
 * These were extracted verbatim from DashboardPage UI files so the data closure
 * (useDashboardData + aggregations + helpers) no longer reaches up into the page
 * layer. DashboardPage UI re-exports them to keep its own imports unchanged.
 */

/** Loops filter applied to the dashboard match feed. */
export type DashboardLoopsFilterValue =
  | { mode: "all" }
  | { mode: "selected"; selectedLoopIds: string[] };

/** Minimal application row shape used by the dashboard recent-jobs surfaces. */
export interface RecentJob {
  company?: string | null;
  createdAt?: unknown;
  id: string;
  status?: unknown;
  title?: string | null;
}
