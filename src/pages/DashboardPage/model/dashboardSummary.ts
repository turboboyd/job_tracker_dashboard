import type { BoardColumnKey } from "src/entities/application/model/status";

/**
 * Normalized board-column counters used across the dashboard.
 * Keep this in one place so UI components don't drift in typing.
 */
export type DashboardSummary = {
  total: number;
} & Record<BoardColumnKey, number>;

export const EMPTY_DASHBOARD_SUMMARY: DashboardSummary = {
  total: 0,
  ACTIVE: 0,
  INTERVIEW: 0,
  OFFER: 0,
  HIRED: 0,
  REJECTED: 0,
  NO_RESPONSE: 0,
  ARCHIVED: 0,
};
