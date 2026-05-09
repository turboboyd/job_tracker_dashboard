import {
  buildMetricsFromAccumulator,
  createInsightsAccumulator,
  mergeMatchInsights,
} from "./dashboardInsights.accumulator";
import type {
  InsightsAccumulator,
  MatchInsightsSummary,
} from "./dashboardInsights.metrics.types";
import { getStaleColumn } from "./dashboardInsights.stale";
import {
  buildTimeline,
  getPipelineIndexes,
} from "./dashboardInsights.timeline";
import {
  summarizeTransitionCounters,
  summarizeTransitionDurations,
} from "./dashboardInsights.transitions";
import type {
  DashboardInsightMatch,
  DashboardInsightsMetrics,
} from "./dashboardInsights.types";

export function buildDashboardInsightsMetrics(
  matches: DashboardInsightMatch[],
  nowMs: number,
): DashboardInsightsMetrics {
  const accumulator = createInsightsAccumulator();

  for (const match of matches) {
    addMatchInsights(accumulator, match, nowMs);
  }

  return buildMetricsFromAccumulator(accumulator);
}

function addMatchInsights(
  accumulator: InsightsAccumulator,
  match: DashboardInsightMatch,
  nowMs: number,
): void {
  const summary = summarizeMatchInsights(match, nowMs);
  if (!summary) return;

  mergeMatchInsights(accumulator, summary);
}

function summarizeMatchInsights(
  match: DashboardInsightMatch,
  nowMs: number,
): MatchInsightsSummary | null {
  const timeline = buildTimeline(match.statusHistory ?? []);
  if (timeline.length === 0) return null;

  const indexes = getPipelineIndexes(timeline);

  return {
    counters: summarizeTransitionCounters(indexes),
    durations: summarizeTransitionDurations(timeline, indexes),
    staleColumn: getStaleColumn(timeline, nowMs),
  };
}
