import { medianDays } from "../model/dashboardTimeSeries";

import type {
  InsightsAccumulator,
  MatchInsightsSummary,
} from "./dashboardInsights.metrics.types";
import {
  countNeedsAttention,
  createEmptyColumnCounts,
  incrementStaleCount,
} from "./dashboardInsights.stale";
import {
  createTransitionCounters,
  createTransitionDurations,
  mergeTransitionCounters,
  mergeTransitionDurations,
} from "./dashboardInsights.transitions";
import type { DashboardInsightsMetrics } from "./dashboardInsights.types";

export function createInsightsAccumulator(): InsightsAccumulator {
  return {
    counters: createTransitionCounters(),
    durations: createTransitionDurations(),
    staleCounts: createEmptyColumnCounts(),
  };
}

export function mergeMatchInsights(
  accumulator: InsightsAccumulator,
  summary: MatchInsightsSummary,
): void {
  mergeTransitionCounters(accumulator.counters, summary.counters);
  mergeTransitionDurations(accumulator.durations, summary.durations);
  incrementStaleCount(accumulator.staleCounts, summary.staleColumn);
}

export function buildMetricsFromAccumulator(
  accumulator: InsightsAccumulator,
): DashboardInsightsMetrics {
  return {
    activeToInterview: percentage(
      accumulator.counters.activeToInterview,
      accumulator.counters.activeEntered,
    ),
    interviewToOffer: percentage(
      accumulator.counters.interviewToOffer,
      accumulator.counters.interviewEntered,
    ),
    medDaysToInterview: medianDays(accumulator.durations.interview),
    medDaysToOffer: medianDays(accumulator.durations.offer),
    needsAttention: countNeedsAttention(accumulator.staleCounts),
    offerToHired: percentage(
      accumulator.counters.offerToHired,
      accumulator.counters.offerEntered,
    ),
    staleCounts: accumulator.staleCounts,
  };
}

function percentage(numerator: number, denominator: number): number {
  if (denominator <= 0) return 0;

  return Math.round((numerator / denominator) * 100);
}
