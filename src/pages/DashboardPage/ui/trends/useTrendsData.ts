import { useMemo } from "react";

import {
  buildDailyBuckets,
  buildMonthlyBuckets,
  buildWeeklyBuckets,
  type Bucket,
  type MatchTimestampsLike,
} from "../../model/dashboardTimeSeries";

import { formatLabel, toNumberSafe } from "./trends.constants";
import type { ModeKey, RangeKey, TrendsPoint } from "./trends.types";

type BucketLike = Pick<Bucket, "startMs" | "counts">;

export function useTrendsBuckets(params: {
  matches: MatchTimestampsLike[];
  range: RangeKey;
  mode: ModeKey;
  locale: string;
}): BucketLike[] {
  const { matches, range, mode, locale } = params;

  return useMemo(() => {
    const byUpdatedAt = mode === "updated";

    if (range === "12m") {
      return buildMonthlyBuckets(matches, { months: 12, byUpdatedAt, locale });
    }

    if (range === "7d") {
      return buildDailyBuckets(matches, { days: 7, byUpdatedAt, locale });
    }

    if (range === "30d") {
      return buildWeeklyBuckets(matches, { weeks: 5, byUpdatedAt, locale });
    }

    return buildWeeklyBuckets(matches, { weeks: 13, byUpdatedAt, locale });
  }, [matches, range, mode, locale]);
}

export function useTrendsChartData(params: {
  buckets: BucketLike[];
  locale: string;
  range: RangeKey;
}): TrendsPoint[] {
  const { buckets, locale, range } = params;

  return useMemo(() => {
    return buckets.map((b) => ({
      date: formatLabel(b.startMs, locale, range),
      applied: toNumberSafe(b.counts.applied),
      interview: toNumberSafe(b.counts.interview),
      offer: toNumberSafe(b.counts.offer),
      rejected: toNumberSafe(b.counts.rejected),
    }));
  }, [buckets, locale, range]);
}

export function useTrendsTotal(chartData: TrendsPoint[]): number {
  return useMemo(() => {
    return chartData.reduce(
      (acc, d) => acc + d.applied + d.interview + d.offer + d.rejected,
      0,
    );
  }, [chartData]);
}
