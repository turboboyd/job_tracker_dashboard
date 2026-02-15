import type { LoopMatchStatus } from "src/entities/loopMatch";

/**
 * Normalized status counters used across the dashboard.
 * Keep this in one place so UI components don't drift in typing.
 */
export type DashboardSummary = {
  total: number;
} & Record<LoopMatchStatus, number>;

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  total: 0,
  new: 0,
  saved: 0,
  applied: 0,
  interview: 0,
  offer: 0,
  rejected: 0,
};
