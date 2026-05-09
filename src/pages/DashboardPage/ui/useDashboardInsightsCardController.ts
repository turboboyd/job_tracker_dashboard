import type { TFunction } from "i18next";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildDashboardInsightKpis,
  buildDashboardInsightsMetrics,
  type DashboardInsightKpi,
  type DashboardInsightMatch,
  type DashboardInsightsKpiLabels,
} from "./DashboardInsightsCard.helpers";

export interface DashboardInsightsCardViewModel {
  kpis: DashboardInsightKpi[];
  title: string;
}

export function useDashboardInsightsCardController(
  matches: DashboardInsightMatch[],
): DashboardInsightsCardViewModel {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const nowMs = useInitialDashboardInsightsNowMs();
  const metrics = useMemo(() => buildDashboardInsightsMetrics(matches, nowMs), [matches, nowMs]);
  const labels = useMemo(() => buildDashboardInsightsKpiLabels(t), [t]);
  const kpis = useMemo(() => buildDashboardInsightKpis(metrics, labels), [labels, metrics]);
  const title = useMemo(
    () => String(t("insights.title", { defaultValue: "Insights" })),
    [t],
  );

  return { kpis, title };
}

function useInitialDashboardInsightsNowMs(): number {
  const [nowMs] = useState(() => Date.now());

  return nowMs;
}

function buildDashboardInsightsKpiLabels(t: TFunction): DashboardInsightsKpiLabels {
  return {
    activeToInterview: String(t("insights.kpi.appliedToInterview", { defaultValue: "Applied -> Interview" })),
    interviewToOffer: String(t("insights.kpi.interviewToOffer", { defaultValue: "Interview -> Offer" })),
    medianToInterview: String(t("insights.kpi.medianToInterview", { defaultValue: "Median to Interview" })),
    medianToOffer: String(t("insights.kpi.medianToOffer", { defaultValue: "Median to Offer" })),
    needsAttention: String(t("insights.kpi.stale", { defaultValue: "Needs attention" })),
    noValue: String(t("common.noValue", { defaultValue: "-" })),
    offerToHired: String(t("insights.kpi.offerToHired", { defaultValue: "Offer -> Hired" })),
  };
}
