import {
  createBucket,
  getMatchTimestamp,
  incrementBucketCount,
} from "./dashboardTimeSeries.bucketCounts";
import type {
  MonthlyBucketOptions,
  MonthlyBucketWindow,
} from "./dashboardTimeSeries.bucketOptions";
import { formatMonthLabel } from "./dashboardTimeSeries.bucketTime";
import type {
  Bucket,
  MatchTimestampsLike,
} from "./dashboardTimeSeries.types";

export function buildMonthlyBuckets(
  matches: MatchTimestampsLike[],
  options: MonthlyBucketOptions,
): Bucket[] {
  const monthWindows = buildMonthlyBucketWindows(options.months, options.locale);
  const firstWindow = monthWindows[0];
  const lastWindow = monthWindows[monthWindows.length - 1];

  if (!firstWindow || !lastWindow) return [];

  const buckets = monthWindows.map(createBucketFromWindow);

  for (const match of matches) {
    const timestamp = getMatchTimestamp(match, options.byUpdatedAt);
    if (timestamp == null) continue;
    if (timestamp < firstWindow.startMs || timestamp >= lastWindow.endMs) continue;

    const bucketIndex = getMonthlyBucketIndex(timestamp, firstWindow.startMs);
    incrementBucketCount(buckets[bucketIndex], match.status);
  }

  return buckets;
}

function buildMonthlyBucketWindows(
  months: number,
  locale: string,
): MonthlyBucketWindow[] {
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const startDate = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);

  return Array.from({ length: months }, (_, index) => {
    const currentMonth = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + index,
      1,
    );
    const nextMonth = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + 1,
      1,
    );
    const startMs = currentMonth.getTime();

    return {
      endMs: nextMonth.getTime(),
      label: formatMonthLabel(startMs, locale),
      startMs,
    };
  });
}

function createBucketFromWindow(window: MonthlyBucketWindow): Bucket {
  return createBucket({
    endMs: window.endMs,
    label: window.label,
    startMs: window.startMs,
  });
}

function getMonthlyBucketIndex(timestamp: number, firstMonthStartMs: number): number {
  const timestampDate = new Date(timestamp);
  const firstMonthDate = new Date(firstMonthStartMs);

  return (
    (timestampDate.getFullYear() - firstMonthDate.getFullYear()) * 12 +
    (timestampDate.getMonth() - firstMonthDate.getMonth())
  );
}

