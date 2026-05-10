import { buildDashboardInsightsMetrics } from "./dashboardInsights.metrics";
import type {
  DashboardInsightHistoryItem,
  DashboardInsightKpi,
  DashboardInsightMatch,
  DashboardInsightsKpiLabels,
  DashboardInsightsMetrics,
} from "./dashboardInsights.types";

export type {
  DashboardInsightHistoryItem,
  DashboardInsightKpi,
  DashboardInsightMatch,
  DashboardInsightsKpiLabels,
  DashboardInsightsMetrics,
};

export { buildDashboardInsightsMetrics };

export function buildDashboardInsightKpis(
  metrics: DashboardInsightsMetrics,
  labels: DashboardInsightsKpiLabels,
): DashboardInsightKpi[] {
  return [
    createDashboardInsightKpi(
      "active-to-interview",
      labels.activeToInterview,
      formatPercentage(metrics.activeToInterview),
    ),
    createDashboardInsightKpi(
      "interview-to-offer",
      labels.interviewToOffer,
      formatPercentage(metrics.interviewToOffer),
    ),
    createDashboardInsightKpi(
      "offer-to-hired",
      labels.offerToHired,
      formatPercentage(metrics.offerToHired),
    ),
    createDashboardInsightKpi(
      "median-to-interview",
      labels.medianToInterview,
      formatDays(metrics.medDaysToInterview, labels.noValue),
    ),
    createDashboardInsightKpi(
      "median-to-offer",
      labels.medianToOffer,
      formatDays(metrics.medDaysToOffer, labels.noValue),
    ),
    createDashboardInsightKpi(
      "needs-attention",
      labels.needsAttention,
      String(metrics.needsAttention),
    ),
  ];
}

function createDashboardInsightKpi(
  id: string,
  label: string,
  value: string,
): DashboardInsightKpi {
  return { id, label, value };
}

function formatPercentage(value: number): string {
  return `${value}%`;
}

function formatDays(days: number | null, fallback: string): string {
  return days == null ? fallback : `${days}d`;
}
