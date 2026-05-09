import {
  createBucket,
  getMatchTimestamp,
  incrementBucketCount,
} from "./dashboardTimeSeries.bucketCounts";
import type { FixedWindowBucketConfig } from "./dashboardTimeSeries.bucketOptions";
import type {
  Bucket,
  MatchTimestampsLike,
} from "./dashboardTimeSeries.types";

export function buildFixedWindowBuckets(
  matches: MatchTimestampsLike[],
  config: FixedWindowBucketConfig,
): Bucket[] {
  const buckets = createFixedWindowBuckets(config);

  for (const match of matches) {
    const timestamp = getMatchTimestamp(match, config.byUpdatedAt);
    if (timestamp == null) continue;
    if (timestamp < config.rangeStartMs || timestamp >= config.rangeEndMs) continue;

    const bucketIndex = getFixedWindowBucketIndex(timestamp, config);
    incrementBucketCount(buckets[bucketIndex], match.status);
  }

  return buckets;
}

function createFixedWindowBuckets(config: FixedWindowBucketConfig): Bucket[] {
  return Array.from({ length: config.bucketCount }, (_, index) => {
    const startMs = config.rangeStartMs + index * config.bucketSizeMs;
    const endMs = startMs + config.bucketSizeMs;

    return createBucket({
      endMs,
      label: config.labelFormatter(startMs, config.locale),
      startMs,
    });
  });
}

function getFixedWindowBucketIndex(
  timestamp: number,
  config: FixedWindowBucketConfig,
): number {
  return Math.floor(
    (config.bucketStartMsForTimestamp(timestamp) - config.rangeStartMs) /
      config.bucketSizeMs,
  );
}

