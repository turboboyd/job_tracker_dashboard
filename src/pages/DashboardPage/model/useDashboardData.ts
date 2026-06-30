// Re-export shim: useDashboardData now lives in src/features/dashboard.
// Kept here so DashboardPage-internal consumers can keep importing from ./model.
export { useDashboardData } from "src/features/dashboard";
export type { DashboardData } from "src/features/dashboard";
