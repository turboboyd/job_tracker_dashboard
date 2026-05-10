import {
  getBoardColumn,
  type BoardColumnKey,
} from "src/entities/application";

import { parseMs } from "../model/dashboardTimeSeries";

import type {
  PipelineIndexes,
  TimelineItem,
} from "./dashboardInsights.metrics.types";
import type { DashboardInsightHistoryItem } from "./dashboardInsights.types";

export function buildTimeline(
  history: DashboardInsightHistoryItem[],
): TimelineItem[] {
  return [...history].sort(compareHistoryItems).map(toTimelineItem);
}

export function getPipelineIndexes(timeline: TimelineItem[]): PipelineIndexes {
  return {
    active: getFirstColumnIndex(timeline, "ACTIVE"),
    hired: getFirstColumnIndex(timeline, "HIRED"),
    interview: getFirstColumnIndex(timeline, "INTERVIEW"),
    offer: getFirstColumnIndex(timeline, "OFFER"),
  };
}

function toTimelineItem(item: DashboardInsightHistoryItem): TimelineItem {
  return {
    column: getBoardColumn(item.status),
    timestamp: getHistoryDate(item),
  };
}

function compareHistoryItems(
  left: DashboardInsightHistoryItem,
  right: DashboardInsightHistoryItem,
): number {
  return (getHistoryDate(left) ?? 0) - (getHistoryDate(right) ?? 0);
}

function getHistoryDate(item: DashboardInsightHistoryItem): number | null {
  return parseMs(item.changedAt ?? item.date ?? null);
}

function getFirstColumnIndex(
  timeline: TimelineItem[],
  column: BoardColumnKey,
): number {
  return timeline.findIndex((item) => item.column === column);
}
