import { normalizeStatusKey, type StatusKey } from "src/entities/application";
import type { ApplicationsRepo } from "src/features/applications";
import { getErrorMessage } from "src/shared/lib";

import type { DashboardLoopsFilterValue } from "../ui";

import type {
  DashboardApplicationsRow,
  DashboardHistoryByAppId,
  DashboardStatusHistoryItem,
  MatchLike,
} from "./dashboardAggregations";

const DASHBOARD_LOOPS_FILTER_STORAGE_KEY = "dashboard:loops-filter:v1";
const HISTORY_EVENTS_LIMIT = 200;

interface ApplicationProcessLike {
  process?: {
    status?: unknown;
    subStatus?: unknown;
  };
}

export function readDashboardLoopsFilter(): DashboardLoopsFilterValue {
  return parseDashboardLoopsFilter(getLocalStorage()?.getItem(DASHBOARD_LOOPS_FILTER_STORAGE_KEY) ?? null);
}

export function writeDashboardLoopsFilter(filter: DashboardLoopsFilterValue): void {
  try {
    getLocalStorage()?.setItem(DASHBOARD_LOOPS_FILTER_STORAGE_KEY, JSON.stringify(filter));
  } catch {
    // Storage can be disabled by the browser; dashboard still works with in-memory state.
  }
}

export function parseDashboardLoopsFilter(raw: string | null): DashboardLoopsFilterValue {
  try {
    if (!raw) return getDefaultLoopsFilter();

    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return getDefaultLoopsFilter();

    const candidate = parsed as Record<string, unknown>;
    if (candidate.mode === "all") return getDefaultLoopsFilter();

    if (candidate.mode === "selected" && Array.isArray(candidate.selectedLoopIds)) {
      return {
        mode: "selected",
        selectedLoopIds: candidate.selectedLoopIds.filter(
          (loopId): loopId is string => typeof loopId === "string",
        ),
      };
    }
  } catch {
    // Invalid persisted filters should never break the dashboard.
  }

  return getDefaultLoopsFilter();
}

export function getDashboardDataErrorMessage(error: unknown): string {
  return getErrorMessage(error, "Failed to load applications");
}

export function filterDashboardMatchesByLoopsFilter(
  matches: readonly MatchLike[],
  filter: DashboardLoopsFilterValue,
): MatchLike[] {
  if (filter.mode === "all") return [...matches];

  const selectedLoopIds = new Set(filter.selectedLoopIds);
  if (selectedLoopIds.size === 0) return [];

  return matches.filter(
    (match) => match.loopId !== undefined && selectedLoopIds.has(match.loopId),
  );
}

export async function fetchDashboardHistoryMap(
  repo: ApplicationsRepo,
  userId: string,
  rows: DashboardApplicationsRow[],
): Promise<DashboardHistoryByAppId> {
  const entries = await Promise.all(
    rows.map(async (row) => [row.id, await fetchDashboardHistoryItems(repo, userId, row)] as const),
  );

  return Object.fromEntries(entries);
}

async function fetchDashboardHistoryItems(
  repo: ApplicationsRepo,
  userId: string,
  row: DashboardApplicationsRow,
): Promise<DashboardStatusHistoryItem[]> {
  try {
    const events = await repo.getApplicationHistory(userId, row.id, HISTORY_EVENTS_LIMIT);
    return buildDashboardHistoryItems(row, events.map((event) => event.data));
  } catch {
    return [];
  }
}

function buildDashboardHistoryItems(
  row: DashboardApplicationsRow,
  events: { createdAt?: unknown; toStatus?: unknown; type?: unknown }[],
): DashboardStatusHistoryItem[] {
  const items: DashboardStatusHistoryItem[] = [
    {
      date: row.data.createdAt,
      status: getInitialApplicationStatus(row),
    },
  ];

  for (const event of events) {
    const statusChange = buildStatusChangeHistoryItem(event);
    if (statusChange) items.push(statusChange);
  }

  return items;
}

function buildStatusChangeHistoryItem(event: {
  createdAt?: unknown;
  toStatus?: unknown;
  type?: unknown;
}): DashboardStatusHistoryItem | null {
  if (event.type !== "STATUS_CHANGE" || !event.toStatus) return null;

  return {
    date: event.createdAt,
    status: normalizeStatusKey(event.toStatus) ?? "SAVED",
  };
}

function getInitialApplicationStatus(row: DashboardApplicationsRow): StatusKey {
  const data = row.data as ApplicationProcessLike;
  const rawStatus = data.process?.subStatus ?? data.process?.status;

  return normalizeStatusKey(rawStatus) ?? "SAVED";
}

function getDefaultLoopsFilter(): DashboardLoopsFilterValue {
  return { mode: "all" };
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  return window.localStorage;
}
