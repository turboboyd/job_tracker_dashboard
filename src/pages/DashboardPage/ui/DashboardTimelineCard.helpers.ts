import { getStageColorForStatus, STATUS_COLOR_HEX, type StatusKey } from "src/entities/application";

import { diffDays, normalizeAppStatus, parseMs } from "../model/dashboardTimeSeries";

export interface DashboardTimelineMatch {
  company?: string | null;
  createdAt?: unknown;
  id: string;
  status?: unknown;
  title?: string | null;
  updatedAt?: unknown;
}

export interface DashboardTimelineRow {
  company: string | null;
  id: string;
  status: StatusKey;
  statusColor: string;
  title: string | null;
  when: number;
}

export interface DashboardTimelineItem {
  company: string;
  dateLabel: string;
  id: string;
  statusColor: string;
  statusLabel: string;
  title: string;
}

export interface DashboardTimelineItemLabels {
  companyFallback: string;
  statusLabel: string;
  titleFallback: string;
}

const MAX_TIMELINE_ROWS = 24;

export function buildDashboardTimelineRows(
  matches: DashboardTimelineMatch[],
  days: number,
  nowMs: number,
): DashboardTimelineRow[] {
  const rows = matches.map(toTimelineRow);
  const recentRows = rows.filter((row): row is DashboardTimelineRow =>
    isRecentTimelineRow(row, days, nowMs),
  );

  recentRows.sort(compareTimelineRowsByNewest);

  return recentRows.slice(0, MAX_TIMELINE_ROWS);
}

export function buildDashboardTimelineItem(
  row: DashboardTimelineRow,
  labels: DashboardTimelineItemLabels,
  locale: string,
): DashboardTimelineItem {
  return {
    company: getTextOrFallback(row.company, labels.companyFallback),
    dateLabel: formatTimelineDate(row.when, locale),
    id: row.id,
    statusColor: row.statusColor,
    statusLabel: labels.statusLabel,
    title: getTextOrFallback(row.title, labels.titleFallback),
  };
}

function toTimelineRow(match: DashboardTimelineMatch): DashboardTimelineRow | null {
  const when = getTimelineTimestamp(match);
  if (when == null) return null;

  const status = normalizeAppStatus(match.status);

  return {
    company: match.company ?? null,
    id: match.id,
    status,
    statusColor: statusColorHex(status),
    title: match.title ?? null,
    when,
  };
}

function getTimelineTimestamp(match: DashboardTimelineMatch): number | null {
  const updatedAt = parseMs(match.updatedAt);
  if (updatedAt != null) return updatedAt;

  return parseMs(match.createdAt);
}

function isRecentTimelineRow(
  row: DashboardTimelineRow | null,
  days: number,
  nowMs: number,
): row is DashboardTimelineRow {
  if (!row) return false;

  return diffDays(row.when, nowMs) <= days;
}

function compareTimelineRowsByNewest(left: DashboardTimelineRow, right: DashboardTimelineRow): number {
  return right.when - left.when;
}

function statusColorHex(status: StatusKey): string {
  return STATUS_COLOR_HEX[getStageColorForStatus(status)];
}

function formatTimelineDate(timestamp: number, locale: string): string {
  return new Date(timestamp).toLocaleDateString(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTextOrFallback(value: string | null, fallback: string): string {
  const trimmed = value?.trim();
  if (!trimmed) return fallback;

  return trimmed;
}
