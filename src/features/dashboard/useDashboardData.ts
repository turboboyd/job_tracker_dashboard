import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import { createApplicationsRepo } from "src/features/applications";
import { useAuthSelectors } from "src/features/auth/model";
import { useBackendLoopsQuery } from "src/features/loops";
import { db } from "src/shared/config/firebase/firestore";

import {
  buildDashboardChartMatches,
  buildDashboardMatches,
  buildDashboardPipelineSummary,
  buildDashboardPlanItems,
  buildRecentJobs,
  type DashboardApplicationsRow,
  type DashboardChartMatch,
  type DashboardHistoryByAppId,
  type DashboardPipelineSummary,
  type DashboardPlanItem,
  type MatchLike,
} from "./dashboardAggregations";
import {
  fetchDashboardHistoryMap,
  filterDashboardMatchesByLoopsFilter,
  getDashboardDataErrorMessage,
  readDashboardLoopsFilter,
  writeDashboardLoopsFilter,
} from "./dashboardData.helpers";
import type { DashboardLoopsFilterValue, RecentJob } from "./types";

export interface DashboardData {
  userId: string | null;
  loops: Loop[];

  loopsFilter: DashboardLoopsFilterValue;
  setLoopsFilter: (value: DashboardLoopsFilterValue) => void;

  matches: MatchLike[];
  matchesAll: MatchLike[];
  chartMatches: DashboardChartMatch[];

  isLoading: boolean;
  error: string | null;

  hasMatches: boolean;
  recentJobs: RecentJob[];
  recent: RecentJob[];

  pipelineSummary: DashboardPipelineSummary;
  planItems: DashboardPlanItem[];
}

export function useDashboardData(): DashboardData {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { userId, isAuthReady } = useAuthSelectors();

  const loopsQuery = useBackendLoopsQuery({
    includeArchived: true,
    skip: !userId || !isAuthReady,
  });
  const loops = loopsQuery.data ?? [];

  const [loopsFilter, setLoopsFilter] = useState<DashboardLoopsFilterValue>(readDashboardLoopsFilter);
  const repo = useMemo(() => createApplicationsRepo(db), []);

  const [appsRows, setAppsRows] = useState<DashboardApplicationsRow[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);
  const [appsError, setAppsError] = useState<string | null>(null);
  const [historyByAppId, setHistoryByAppId] = useState<DashboardHistoryByAppId>({});

  useEffect(() => {
    writeDashboardLoopsFilter(loopsFilter);
  }, [loopsFilter]);

  useEffect(() => {
    const currentUserId = userId;
    if (!isAuthReady || !currentUserId) return;
    const userIdForRequest: string = currentUserId;

    let cancelled = false;

    async function loadApplications() {
      try {
        setAppsLoading(true);
        setAppsError(null);

        const rows = await repo.queryAllActiveApplications(userIdForRequest, 500);
        if (!cancelled) setAppsRows(rows);
      } catch (error: unknown) {
        if (!cancelled) setAppsError(getDashboardDataErrorMessage(error));
      } finally {
        if (!cancelled) setAppsLoading(false);
      }
    }

    void loadApplications();

    return () => {
      cancelled = true;
    };
  }, [isAuthReady, repo, userId]);

  useEffect(() => {
    const currentUserId = userId;
    if (!isAuthReady || !currentUserId || appsRows.length === 0) return;
    const userIdForRequest: string = currentUserId;

    let cancelled = false;

    async function loadApplicationHistory() {
      try {
        const historyMap = await fetchDashboardHistoryMap(repo, userIdForRequest, appsRows);
        if (!cancelled) setHistoryByAppId(historyMap);
      } catch {
        if (!cancelled) setHistoryByAppId({});
      }
    }

    void loadApplicationHistory();

    return () => {
      cancelled = true;
    };
  }, [appsRows, isAuthReady, repo, userId]);

  const matchesAll = useMemo<MatchLike[]>(
    () => buildDashboardMatches(appsRows, historyByAppId),
    [appsRows, historyByAppId],
  );

  const matches = useMemo(
    () => filterDashboardMatchesByLoopsFilter(matchesAll, loopsFilter),
    [loopsFilter, matchesAll],
  );

  const pipelineSummary = useMemo(() => buildDashboardPipelineSummary(matches), [matches]);
  const planItems = useMemo(() => buildDashboardPlanItems(matches), [matches]);
  const recent = useMemo(() => buildRecentJobs(matches), [matches]);
  const chartMatches = useMemo<DashboardChartMatch[]>(
    () => buildDashboardChartMatches(matches),
    [matches],
  );

  return {
    chartMatches,
    error: appsError ? appsError || t("loadError", "Failed to load applications") : null,
    hasMatches: pipelineSummary.total > 0,
    isLoading: appsLoading,
    loops,
    loopsFilter,
    matches,
    matchesAll,
    pipelineSummary,
    planItems,
    recent,
    recentJobs: recent,
    setLoopsFilter,
    userId,
  };
}
