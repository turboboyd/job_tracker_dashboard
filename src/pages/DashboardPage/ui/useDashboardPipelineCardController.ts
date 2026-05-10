import { useMemo } from "react";

import {
  buildDashboardPipelineSlices,
  type DashboardPipelineSummary,
} from "./DashboardPipelineCard.helpers";
import { useDashboardTranslate } from "./useDashboardTranslate";

export interface DashboardPipelineLabels {
  chartTitle: string;
  title: string;
  total: string;
  totalLabel: string;
}

export function useDashboardPipelineCardController(summary: DashboardPipelineSummary) {
  const translate = useDashboardTranslate();

  const labels = useMemo<DashboardPipelineLabels>(
    () => ({
      chartTitle: translate("pipeline.chartTitle", "Applications"),
      title: translate("pipeline.title", "Pipeline"),
      total: translate("pipeline.total", "Total"),
      totalLabel: translate("pipeline.totalLabel", "Total"),
    }),
    [translate],
  );

  const slices = useMemo(
    () => buildDashboardPipelineSlices(summary, translate),
    [summary, translate],
  );

  return {
    centerBottom: String(summary.total),
    labels,
    slices,
  };
}
