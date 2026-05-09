import type { TFunction } from "i18next";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildRecentJobViewModel,
  type DashboardTranslator,
  type RecentJob,
  type RecentJobViewModel,
} from "./DashboardRecentJobsCard.helpers";

interface DashboardRecentJobsCardControllerParams {
  jobs: RecentJob[];
  onOpenJob: ((jobId: string) => void) | undefined;
  onViewAll: () => void;
}

export interface DashboardRecentJobsLabels {
  empty: string;
  title: string;
  viewAll: string;
}

export interface DashboardRecentJobsCardViewModel {
  jobs: RecentJobViewModel[];
  labels: DashboardRecentJobsLabels;
  onOpenJob: (jobId: string) => void;
  onViewAll: () => void;
}

export function useDashboardRecentJobsCardController({
  jobs,
  onOpenJob,
  onViewAll,
}: DashboardRecentJobsCardControllerParams): DashboardRecentJobsCardViewModel {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const { t: tGlobal } = useTranslation();
  const nowMs = useInitialRecentJobsNowMs();
  const tr = useDashboardTranslator(t);
  const trGlobal = useDashboardTranslator(tGlobal);
  const labels = useMemo(() => buildDashboardRecentJobsLabels(tr), [tr]);
  const recentJobs = useMemo(
    () => buildRecentJobsViewModel(jobs, tr, trGlobal, nowMs),
    [jobs, nowMs, tr, trGlobal],
  );

  const handleOpenJob = useCallback(
    (jobId: string) => {
      if (onOpenJob) {
        onOpenJob(jobId);
        return;
      }

      onViewAll();
    },
    [onOpenJob, onViewAll],
  );

  return {
    jobs: recentJobs,
    labels,
    onOpenJob: handleOpenJob,
    onViewAll,
  };
}

function useInitialRecentJobsNowMs(): number {
  const [nowMs] = useState(() => Date.now());

  return nowMs;
}

function useDashboardTranslator(t: TFunction): DashboardTranslator {
  return useCallback<DashboardTranslator>(
    (key, fallback, options) => String(t(key, { defaultValue: fallback, ...options })),
    [t],
  );
}

function buildDashboardRecentJobsLabels(
  tr: DashboardTranslator,
): DashboardRecentJobsLabels {
  return {
    empty: tr("recent.empty", "No applications yet. Add your first one to see activity here."),
    title: tr("recent.title", "Recent applications"),
    viewAll: tr("recent.viewAll", "View all"),
  };
}

function buildRecentJobsViewModel(
  jobs: RecentJob[],
  tr: DashboardTranslator,
  trGlobal: DashboardTranslator,
  nowMs: number,
): RecentJobViewModel[] {
  return jobs.map((job) => buildRecentJobViewModel(job, tr, trGlobal, nowMs));
}
