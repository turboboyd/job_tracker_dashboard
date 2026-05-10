import {
  BOARD_COLUMN_KEYS,
  getBoardColumn,
  normalizeStatusKey,
  type BoardColumnKey,
  type StatusKey,
} from "src/entities/application";
import type { ApplicationDoc } from "src/features/applications";

import type { RecentJob } from "../ui/DashboardRecentJobsCard";

export interface DashboardStatusHistoryItem {
  status: StatusKey;
  date?: unknown;
  changedAt?: unknown;
}

export interface MatchLike {
  id: string;
  loopId?: string;
  createdAt?: unknown;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  nextActionAt?: unknown;
  nextActionText?: string | null;
  status?: unknown;
  updatedAt?: unknown;
  statusHistory?: DashboardStatusHistoryItem[];
}

export interface DashboardPlanItem {
  bucket: DashboardPlanBucket;
  company: string | null;
  id: string;
  isOverdue: boolean;
  isToday: boolean;
  isTomorrow: boolean;
  nextActionAt: unknown;
  nextActionText: string | null;
  sortMs: number;
  status: StatusKey;
  title: string | null;
}

export type DashboardPlanBucket = "overdue" | "today" | "tomorrow" | "upcoming";

export interface DashboardChartMatch {
  status: StatusKey;
  createdAt: unknown;
  updatedAt: unknown;
  loopId: string | undefined;
  statusHistory?: DashboardStatusHistoryItem[];
}

export interface DashboardPipelineSummary {
  total: number;
  byColumn: Record<BoardColumnKey, number>;
}

export interface DashboardApplicationsRow {
  id: string;
  data: ApplicationDoc;
}

export type DashboardHistoryByAppId = Record<string, DashboardStatusHistoryItem[]>;

interface DashboardSummaryBuckets {
  total: number;
  byStatus: Record<BoardColumnKey, number>;
}

interface ApplicationProcessLike {
  process?: {
    subStatus?: unknown;
    status?: unknown;
  };
}

function getProcessStatus(data: ApplicationProcessLike): StatusKey {
  const statusRaw = data.process?.subStatus ?? data.process?.status;
  return normalizeStatusKey(statusRaw) ?? "SAVED";
}

export function toMillis(value: unknown): number {
  if (
    value &&
    typeof (value as { toMillis?: unknown }).toMillis === "function"
  ) {
    return (value as { toMillis: () => number }).toMillis();
  }

  if (typeof value === "number") return value;

  if (typeof value === "string") {
    const ms = Date.parse(value);
    return Number.isFinite(ms) ? ms : 0;
  }

  const seconds = (value as { seconds?: unknown } | null)?.seconds;
  if (typeof seconds === "number") return seconds * 1000;

  return 0;
}

function buildSummaryBuckets(cols: readonly BoardColumnKey[]): DashboardSummaryBuckets {
  const byStatus = Object.fromEntries(
    BOARD_COLUMN_KEYS.map((key: BoardColumnKey) => [key, 0]),
  ) as Record<BoardColumnKey, number>;

  let total = 0;
  for (const status of cols) {
    total += 1;
    byStatus[status] = (byStatus[status] ?? 0) + 1;
  }

  return { total, byStatus };
}

export function buildDashboardMatches(
  appsRows: readonly DashboardApplicationsRow[],
  historyByAppId: DashboardHistoryByAppId,
): MatchLike[] {
  return appsRows.map((row) => {
    const status = getProcessStatus(row.data as ApplicationProcessLike);

    return {
      id: row.id,
      ...(row.data.loopLinkage?.loopId ? { loopId: row.data.loopLinkage.loopId } : {}),
      createdAt: row.data.createdAt,
      updatedAt: row.data.updatedAt,
      title: row.data.job?.roleTitle ?? null,
      company: row.data.job?.companyName ?? null,
      location: row.data.job?.locationText ?? null,
      url: row.data.job?.vacancyUrl ?? null,
      notes: row.data.notes?.currentNote ?? null,
      nextActionAt: row.data.process.nextActionAt,
      nextActionText: row.data.process.nextActionText ?? null,
      status,
      statusHistory: historyByAppId[row.id] ?? [],
    } satisfies MatchLike;
  });
}

export function buildDashboardPipelineSummary(
  matches: readonly MatchLike[],
): DashboardPipelineSummary {
  const cols = matches.map((match) => getBoardColumn(match.status as StatusKey));
  const summary = buildSummaryBuckets(cols);

  return {
    total: summary.total,
    byColumn: summary.byStatus,
  };
}

export function buildRecentJobs(matches: readonly MatchLike[]): RecentJob[] {
  const items: RecentJob[] = matches.map((match) => ({
    id: match.id,
    title: match.title ?? null,
    company: match.company ?? null,
    status: match.status,
    createdAt: match.createdAt,
  }));

  items.sort((left, right) => toMillis(right.createdAt) - toMillis(left.createdAt));

  return items.slice(0, 5);
}

export function buildDashboardPlanItems(
  matches: readonly MatchLike[],
  nowMs = Date.now(),
  take = 30,
): DashboardPlanItem[] {
  const today = new Date(nowMs);
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const tomorrowStart = todayStart + 24 * 60 * 60 * 1000;
  const afterTomorrowStart = tomorrowStart + 24 * 60 * 60 * 1000;

  return matches
    .map((match): DashboardPlanItem | null => {
      const sortMs = toMillis(match.nextActionAt);
      if (!sortMs) return null;
      const bucket = getPlanBucket(sortMs, nowMs, tomorrowStart, afterTomorrowStart);

      return {
        bucket,
        company: match.company ?? null,
        id: match.id,
        isOverdue: bucket === "overdue",
        isToday: bucket === "today",
        isTomorrow: bucket === "tomorrow",
        nextActionAt: match.nextActionAt,
        nextActionText: match.nextActionText ?? null,
        sortMs,
        status: normalizeStatusKey(match.status) ?? "SAVED",
        title: match.title ?? null,
      };
    })
    .filter((item): item is DashboardPlanItem => item !== null)
    .sort((left, right) => left.sortMs - right.sortMs)
    .slice(0, take);
}

function getPlanBucket(
  sortMs: number,
  nowMs: number,
  tomorrowStart: number,
  afterTomorrowStart: number,
): DashboardPlanBucket {
  if (sortMs < nowMs) return "overdue";
  if (sortMs < tomorrowStart) return "today";
  if (sortMs < afterTomorrowStart) return "tomorrow";

  return "upcoming";
}

export function buildDashboardChartMatches(
  matches: readonly MatchLike[],
): DashboardChartMatch[] {
  return matches.map((match) => ({
    status: normalizeStatusKey(match.status) ?? "SAVED",
    createdAt: match.createdAt,
    updatedAt: match.updatedAt,
    loopId: match.loopId,
    statusHistory: match.statusHistory ?? [],
  }));
}
