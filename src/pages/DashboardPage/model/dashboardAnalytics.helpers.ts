import { toMillis } from "src/shared/lib";

import type { CustomRange, ModeKey, RangeKey } from "../ui/trends/trends.types";

import type { DashboardChartMatch } from "./dashboardAggregations";

const DAY_MS = 24 * 60 * 60 * 1000;

interface DashboardAnalyticsWindow {
  fromMs: number;
  toMs: number;
}

export function filterDashboardAnalyticsMatches(
  matches: DashboardChartMatch[],
  range: RangeKey,
  mode: ModeKey,
  customRange: CustomRange,
  nowMs: number,
): DashboardChartMatch[] {
  const window = buildDashboardAnalyticsWindow(range, customRange, nowMs);

  return matches.filter((match) => {
    const timestamp = getAnalyticsMatchTimestamp(match, mode);
    if (!timestamp) return false;

    return timestamp >= window.fromMs && timestamp <= window.toMs;
  });
}

function buildDashboardAnalyticsWindow(
  range: RangeKey,
  customRange: CustomRange,
  nowMs: number,
): DashboardAnalyticsWindow {
  if (range === "custom" && customRange) {
    return {
      fromMs: clampDayStart(customRange.from.getTime()),
      toMs: clampDayStart(customRange.to.getTime()) + DAY_MS - 1,
    };
  }

  return {
    fromMs: nowMs - getPresetRangeDays(range) * DAY_MS,
    toMs: nowMs,
  };
}

function getAnalyticsMatchTimestamp(match: DashboardChartMatch, mode: ModeKey): number {
  const createdAt = toMillis(match.createdAt);
  if (mode === "created") return createdAt;

  const updatedAt = toMillis(match.updatedAt);
  return updatedAt > 0 ? updatedAt : createdAt;
}

function getPresetRangeDays(range: RangeKey): number {
  if (range === "12m") return 365;
  if (range === "90d") return 90;
  if (range === "30d") return 30;

  return 7;
}

function clampDayStart(ms: number): number {
  const date = new Date(ms);
  date.setHours(0, 0, 0, 0);

  return date.getTime();
}
