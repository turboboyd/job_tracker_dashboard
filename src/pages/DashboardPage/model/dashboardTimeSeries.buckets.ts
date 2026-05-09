import type {
  DailyBucketOptions,
  WeeklyBucketOptions,
} from "./dashboardTimeSeries.bucketOptions";
import {
  DAY_MS,
  WEEK_MS,
  formatDayLabel,
  startOfDayMs,
  startOfWeekMs,
} from "./dashboardTimeSeries.bucketTime";
import { buildFixedWindowBuckets } from "./dashboardTimeSeries.fixedBuckets";
import type {
  Bucket,
  MatchTimestampsLike,
} from "./dashboardTimeSeries.types";

export { bucketToPipelineLine } from "./dashboardTimeSeries.bucketCounts";
export { buildMonthlyBuckets } from "./dashboardTimeSeries.monthlyBuckets";
export type {
  DailyBucketOptions,
  MonthlyBucketOptions,
  WeeklyBucketOptions,
} from "./dashboardTimeSeries.bucketOptions";

export function buildDailyBuckets(
  matches: MatchTimestampsLike[],
  options: DailyBucketOptions,
): Bucket[] {
  const rangeEndMs = startOfDayMs(Date.now()) + DAY_MS;

  return buildFixedWindowBuckets(matches, {
    bucketCount: options.days,
    bucketSizeMs: DAY_MS,
    byUpdatedAt: options.byUpdatedAt,
    bucketStartMsForTimestamp: startOfDayMs,
    labelFormatter: formatDayLabel,
    locale: options.locale,
    rangeEndMs,
    rangeStartMs: rangeEndMs - options.days * DAY_MS,
  });
}

export function buildWeeklyBuckets(
  matches: MatchTimestampsLike[],
  options: WeeklyBucketOptions,
): Bucket[] {
  const rangeEndMs = startOfWeekMs(Date.now()) + WEEK_MS;

  return buildFixedWindowBuckets(matches, {
    bucketCount: options.weeks,
    bucketSizeMs: WEEK_MS,
    byUpdatedAt: options.byUpdatedAt,
    bucketStartMsForTimestamp: startOfWeekMs,
    labelFormatter: formatDayLabel,
    locale: options.locale,
    rangeEndMs,
    rangeStartMs: rangeEndMs - options.weeks * WEEK_MS,
  });
}
