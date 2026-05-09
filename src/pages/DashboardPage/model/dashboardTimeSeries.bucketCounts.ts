import {
  STATUS_KEYS,
  getBoardColumn,
  type BoardColumnKey,
  type StatusKey,
} from "src/entities/application";

import {
  createEmptyStatusCounts,
  normalizeAppStatus,
  parseMs,
} from "./dashboardTimeSeries.shared";
import type {
  Bucket,
  MatchTimestampsLike,
  PipelineLinePoint,
} from "./dashboardTimeSeries.types";

const PIPELINE_LINE_COLUMNS: ReadonlySet<BoardColumnKey> = new Set([
  "ACTIVE",
  "INTERVIEW",
  "OFFER",
  "HIRED",
  "REJECTED",
  "NO_RESPONSE",
]);

export function createBucket(args: {
  endMs: number;
  label: string;
  startMs: number;
}): Bucket {
  return {
    counts: createEmptyStatusCounts(),
    endMs: args.endMs,
    label: args.label,
    startMs: args.startMs,
  };
}

export function getMatchTimestamp(
  match: MatchTimestampsLike,
  byUpdatedAt: boolean,
): number | null {
  return parseMs(byUpdatedAt ? match.updatedAt : match.createdAt);
}

export function incrementBucketCount(
  bucket: Bucket | undefined,
  status: unknown,
): void {
  if (!bucket) return;

  const normalizedStatus = normalizeAppStatus(status);
  bucket.counts[normalizedStatus] += 1;
}

export function bucketToPipelineLine(buckets: Bucket[]): PipelineLinePoint[] {
  return buckets.map((bucket) => ({
    label: bucket.label,
    value: countPipelineStatuses(bucket.counts),
  }));
}

function countPipelineStatuses(counts: Record<StatusKey, number>): number {
  let total = 0;

  for (const statusKey of STATUS_KEYS) {
    const column = getBoardColumn(statusKey);
    if (!PIPELINE_LINE_COLUMNS.has(column)) continue;

    total += counts[statusKey] ?? 0;
  }

  return total;
}

