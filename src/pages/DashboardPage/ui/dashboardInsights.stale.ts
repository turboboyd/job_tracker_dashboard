import {
  BOARD_COLUMN_KEYS,
  type BoardColumnKey,
} from "src/entities/application";

import { diffDays } from "../model/dashboardTimeSeries";

import {
  NEEDS_ATTENTION_COLUMNS,
  PIPELINE_COLUMNS,
  STALE_DAYS_THRESHOLD,
} from "./dashboardInsights.metrics.constants";
import type { TimelineItem } from "./dashboardInsights.metrics.types";

export function createEmptyColumnCounts(): Record<BoardColumnKey, number> {
  return Object.fromEntries(
    BOARD_COLUMN_KEYS.map((column) => [column, 0]),
  ) as Record<BoardColumnKey, number>;
}

export function getStaleColumn(
  timeline: TimelineItem[],
  nowMs: number,
): BoardColumnKey | null {
  const last = timeline[timeline.length - 1];
  if (!last?.timestamp) return null;

  const daysInColumn = diffDays(last.timestamp, nowMs);
  if (daysInColumn < STALE_DAYS_THRESHOLD) return null;
  if (!PIPELINE_COLUMNS.includes(last.column)) return null;

  return last.column;
}

export function incrementStaleCount(
  staleCounts: Record<BoardColumnKey, number>,
  column: BoardColumnKey | null,
): void {
  if (!column) return;
  staleCounts[column] += 1;
}

export function countNeedsAttention(
  staleCounts: Record<BoardColumnKey, number>,
): number {
  return NEEDS_ATTENTION_COLUMNS.reduce(
    (total, column) => total + staleCounts[column],
    0,
  );
}

