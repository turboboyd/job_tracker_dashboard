import { useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";

import { buildDashboardStatColumns } from "./DashboardStats.helpers";
import { renderDashboardStats } from "./DashboardStats.render";
import {
  buildDashboardStatsLabels,
  buildDashboardStatsViewModel,
  type DashboardStatsProps,
} from "./DashboardStats.viewModel";

export function DashboardStats({
  error,
  isLoading,
  onAddFirstJob,
  onGoJobs,
  summary,
}: DashboardStatsProps) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const tr = useCallback(
    (key: string, fallback: string) => String(t(key, { defaultValue: fallback })),
    [t],
  );
  const labels = useMemo(() => buildDashboardStatsLabels(tr), [tr]);
  const columns = useMemo(() => buildDashboardStatColumns(tr), [tr]);
  const viewModel = buildDashboardStatsViewModel({
    columns,
    error,
    isLoading,
    labels,
    onAddFirstJob,
    onGoJobs,
    summary,
  });

  return renderDashboardStats(viewModel);
}
