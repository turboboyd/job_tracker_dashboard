import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BOARD_COLUMN_KEYS,
  getBoardColumn,
  type BoardColumnKey,
  normalizeStatusKey,
  type StatusKey,
} from "src/entities/application/model/status";
import { useAuthSelectors } from "src/entities/auth";
import { useGetLoopsQuery, type Loop } from "src/entities/loop";
import { createApplicationsRepo } from "src/pages/ApplicationsPage/api/applicationsRepo";
import type { ApplicationDoc } from "src/pages/ApplicationsPage/api/applicationsRepo";
import { db } from "src/shared/config/firebase/firebase";

import type { DashboardLoopsFilterValue } from "../ui";
import type { RecentJob } from "../ui/DashboardRecentJobsCard";

type MatchLike = {
  id: string;
  loopId?: string;
  createdAt?: unknown;
  title?: string | null;
  company?: string | null;
  location?: string | null;
  url?: string | null;
  notes?: string | null;
  status?: unknown;
  updatedAt?: unknown;
  statusHistory?: Array<{ status: unknown; date?: unknown; changedAt?: unknown }>;
};

export type DashboardChartMatch = {
  status: StatusKey;
  createdAt: unknown;
  updatedAt: unknown;
  loopId: string | undefined;
  statusHistory?: Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }>;
};

export type DashboardPipelineSummary = {
  total: number;
  byColumn: Record<BoardColumnKey, number>;
};

export type DashboardData = {
  userId: string | null;
  loops: Loop[];

  loopsFilter: DashboardLoopsFilterValue;
  setLoopsFilter: (v: DashboardLoopsFilterValue) => void;

  matches: MatchLike[];
  matchesAll: MatchLike[];
  chartMatches: DashboardChartMatch[];

  isLoading: boolean;
  error: string | null;

  hasMatches: boolean;
  /** Most recent jobs (used by DashboardActivityPage) */
  recentJobs: RecentJob[];
  /** Back-compat alias */
  recent: RecentJob[];

  pipelineSummary: DashboardPipelineSummary;
};

const LS_KEY = "dashboard:loops-filter:v1";

function safeParseFilter(raw: string | null): DashboardLoopsFilterValue {
  try {
    if (!raw) return { mode: "all" };
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return { mode: "all" };
    const obj = parsed as Record<string, unknown>;
    if (obj.mode === "all") return { mode: "all" };
    if (obj.mode === "selected" && Array.isArray(obj.selectedLoopIds)) {
      return {
        mode: "selected",
        selectedLoopIds: obj.selectedLoopIds.filter(
          (x): x is string => typeof x === "string",
        ),
      };
    }
  } catch {
    // ignore
  }
  return { mode: "all" };
}

function toMillis(value: unknown): number {
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
  // Firestore timestamp { seconds }
  const seconds = (value as { seconds?: unknown } | null)?.seconds;
  if (typeof seconds === "number") return seconds * 1000;
  return 0;
}

function buildSummary(cols: BoardColumnKey[]): {
  total: number;
  byStatus: Record<BoardColumnKey, number>;
} {
  const byStatus = Object.fromEntries(
    BOARD_COLUMN_KEYS.map((k: BoardColumnKey) => [k, 0]),
  ) as Record<BoardColumnKey, number>;

  let total = 0;
  for (const st of cols) {
    total += 1;
    byStatus[st] = (byStatus[st] ?? 0) + 1;
  }
  return { total, byStatus };
}

function toPipelineSummary(
  total: number,
  byStatus: Record<BoardColumnKey, number>,
): DashboardPipelineSummary {
  return { total, byColumn: byStatus };
}

export function useDashboardData(): DashboardData {
    const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { userId, isAuthReady } = useAuthSelectors();

  const loopsQ = useGetLoopsQuery(userId && isAuthReady ? undefined : skipToken);
  const loops = loopsQ.data ?? [];

  const [loopsFilter, setLoopsFilter] = useState<DashboardLoopsFilterValue>(
    () =>
      safeParseFilter(
        typeof window !== "undefined"
          ? window.localStorage.getItem(LS_KEY)
          : null,
      ),
  );

  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, JSON.stringify(loopsFilter));
    } catch {
      // ignore
    }
  }, [loopsFilter]);

  const repo = useMemo(() => createApplicationsRepo(db), []);

  const [appsRows, setAppsRows] = useState<Array<{ id: string; data: ApplicationDoc }>>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [historyByAppId, setHistoryByAppId] = useState<Record<string, Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }>>>({});

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    let cancelled = false;
    (async () => {
      try {
        setAppsLoading(true);
        setAppsError(null);
        const rows = await repo.queryAllActiveApplications(userId, 500);
        if (!cancelled) setAppsRows(rows);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        if (!cancelled) setAppsError(message);
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthReady, userId, repo]);

  useEffect(() => {
    if (!isAuthReady || !userId) return;
    if (!appsRows.length) return;

    let cancelled = false;

    (async () => {
      try {
        const entries = await Promise.all(
          appsRows.map(async (row) => {
            try {
              const events = await repo.getApplicationHistory(userId, row.id, 200);
              const items: Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }> = [];

              const statusRaw =
                (row.data as { process?: { subStatus?: unknown; status?: unknown } })?.process?.subStatus ??
                (row.data as { process?: { subStatus?: unknown; status?: unknown } })?.process?.status;
              const initial: StatusKey = normalizeStatusKey(statusRaw) ?? "SAVED";
              items.push({ status: initial, date: row.data.createdAt });

              for (const ev of events) {
                const d = ev.data as unknown as { type?: unknown; toStatus?: unknown; createdAt?: unknown };
                if (d?.type === "STATUS_CHANGE" && d?.toStatus) {
                  const st: StatusKey = normalizeStatusKey(d.toStatus) ?? "SAVED";
                  items.push({ status: st, date: d.createdAt });
                }
              }

              return [row.id, items] as const;
            } catch {
              return [row.id, [] as Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }>] as const;
            }
          }),
        );

        if (cancelled) return;
        const map: Record<string, Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }>> = {};
        for (const [id, arr] of entries) map[id] = arr;
        setHistoryByAppId(map);
      } catch {
        if (!cancelled) setHistoryByAppId({});
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, userId, appsRows, repo]);


  const matchesAll = useMemo<MatchLike[]>(() => {
    return appsRows.map((r) => {
      const a = r.data;
      const statusRaw =
        (a as { process?: { subStatus?: unknown; status?: unknown } })?.process
          ?.subStatus ??
        (a as { process?: { subStatus?: unknown; status?: unknown } })?.process
          ?.status;
      const status: StatusKey = normalizeStatusKey(statusRaw) ?? "SAVED";
      return {
        id: r.id,
        loopId: undefined,
        createdAt: a.createdAt,
        updatedAt: a.updatedAt,
        title: a.job?.roleTitle ?? null,
        company: a.job?.companyName ?? null,
        location: a.job?.locationText ?? null,
        url: a.job?.vacancyUrl ?? null,
        notes: a.notes?.currentNote ?? null,
        status,
        statusHistory: historyByAppId[r.id],
      };
    });
  }, [appsRows, historyByAppId]);

  const isLoading = appsLoading;
  const error = appsError ? (appsError || t("loadError", "Failed to load applications")) : null;

  const matches = useMemo(() => {
    // Applications are not tied to loops. Keep the filter state for UI, but do not filter.
    return matchesAll;
  }, [matchesAll]);

  const summary = useMemo(() => {
    const cols = matches.map((m) => getBoardColumn(m.status as StatusKey));
    return buildSummary(cols);
  }, [matches]);

  const hasMatches = summary.total > 0;

  const recent = useMemo<RecentJob[]>(() => {
    const copy: RecentJob[] = matches.map((m) => ({
      id: m.id,
      title: m.title ?? null,
      company: m.company ?? null,
      status: m.status,
      createdAt: m.createdAt,
    }));
    copy.sort((a, b) => toMillis(b.createdAt) - toMillis(a.createdAt));
    return copy.slice(0, 5);
  }, [matches]);

  const chartMatches = useMemo<DashboardChartMatch[]>(() => {
    return matches.flatMap((m) => {
      const st: StatusKey = normalizeStatusKey(m.status) ?? "SAVED";
      return [
        {
          status: st,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          loopId: m.loopId,
          statusHistory: (m as { statusHistory?: Array<{ status: StatusKey; date?: unknown; changedAt?: unknown }> }).statusHistory,
        },
      ];
    });
  }, [matches]);

  const pipelineSummary = useMemo(() => {
    return toPipelineSummary(summary.total, summary.byStatus);
  }, [summary]);

  return {
    userId,
    loops,
    loopsFilter,
    setLoopsFilter,
    matches,
    matchesAll,
    chartMatches,
    isLoading,
    error,
    hasMatches,
    recentJobs: recent,
    recent,
    pipelineSummary,
  };
}