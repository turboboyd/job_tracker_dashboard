import type { BoardColumnKey, StatusKey } from "src/entities/application";

export interface DashboardInsightHistoryItem {
  changedAt?: unknown;
  date?: unknown;
  status: StatusKey;
}

export interface DashboardInsightMatch {
  createdAt: unknown;
  status: StatusKey;
  statusHistory?: DashboardInsightHistoryItem[];
  updatedAt: unknown;
}

export interface DashboardInsightsMetrics {
  activeToInterview: number;
  interviewToOffer: number;
  medDaysToInterview: number | null;
  medDaysToOffer: number | null;
  needsAttention: number;
  offerToHired: number;
  staleCounts: Record<BoardColumnKey, number>;
}

export interface DashboardInsightKpi {
  id: string;
  label: string;
  value: string;
}

export interface DashboardInsightsKpiLabels {
  activeToInterview: string;
  interviewToOffer: string;
  medianToInterview: string;
  medianToOffer: string;
  needsAttention: string;
  noValue: string;
  offerToHired: string;
}
