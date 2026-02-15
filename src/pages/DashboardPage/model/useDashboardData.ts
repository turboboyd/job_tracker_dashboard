import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { useAuthSelectors } from "src/entities/auth";
import { useGetLoopsQuery, type Loop } from "src/entities/loop";
import type { LoopMatchStatus } from "src/entities/loopMatch";
import { useGetAllMatchesQuery } from "src/entities/loopMatch";

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
};

export type DashboardChartMatch = {
  status: LoopMatchStatus;
  createdAt: unknown;
  updatedAt: unknown;
  loopId: string | undefined;
};

export type DashboardPipelineSummary = {
  total: number;
  new: number;
  applied: number;
  saved: number;
  interview: number;
  offer: number;
  rejected: number;
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

function statusKey(value: unknown): string {
  if (typeof value === "string" && value.trim().length > 0) {
    return value.trim().toLowerCase();
  }
  return "unknown";
}

function normalizeStatus(value: unknown): LoopMatchStatus | null {
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (
    v === "new" ||
    v === "saved" ||
    v === "applied" ||
    v === "interview" ||
    v === "offer" ||
    v === "rejected"
  ) {
    return v as LoopMatchStatus;
  }
  return null;
}

function buildSummary(statuses: string[]): {
  total: number;
  byStatus: Record<string, number>;
} {
  const byStatus: Record<string, number> = {};
  let total = 0;
  for (const st of statuses) {
    total += 1;
    byStatus[st] = (byStatus[st] ?? 0) + 1;
  }
  return { total, byStatus };
}

function toPipelineSummary(
  total: number,
  byStatus: Record<string, number>,
): DashboardPipelineSummary {
  const pick = (k: keyof Omit<DashboardPipelineSummary, "total">) =>
    byStatus[k] ?? 0;
  return {
    total,
    new: pick("new"),
    applied: pick("applied"),
    saved: pick("saved"),
    interview: pick("interview"),
    offer: pick("offer"),
    rejected: pick("rejected"),
  };
}

export function useDashboardData(): DashboardData {
    const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { userId } = useAuthSelectors();

  const loopsQ = useGetLoopsQuery(userId ? undefined : skipToken);
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

  const matchesQ = useGetAllMatchesQuery(userId ? undefined : skipToken);
  const matchesAll = useMemo(
    () => ((matchesQ.data ?? []) as MatchLike[]),
    [matchesQ.data],
  );

  const isLoading = matchesQ.isLoading;
  const error = matchesQ.error ? t("loadError", "Failed to load matches") : null;

  const matches = useMemo(() => {
    if (loopsFilter.mode === "all") return matchesAll;
    const set = new Set(loopsFilter.selectedLoopIds);
    return matchesAll.filter((m) => m.loopId && set.has(m.loopId));
  }, [matchesAll, loopsFilter]);

  const summary = useMemo(() => {
    const statuses = matches.map((m) => statusKey(m.status));
    return buildSummary(statuses);
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
      const st = normalizeStatus(m.status);
      if (!st) return [];
      return [
        {
          status: st,
          createdAt: m.createdAt,
          updatedAt: m.updatedAt,
          loopId: m.loopId,
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
