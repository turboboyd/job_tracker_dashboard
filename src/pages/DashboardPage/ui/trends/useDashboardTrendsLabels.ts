import type { TFunction } from "i18next";
import { useMemo } from "react";

import type { RangeKey } from "./trends.types";

export interface DashboardTrendsLabels {
  apply: string;
  cancel: string;
  created: string;
  customRange: string;
  customTitle: string;
  emptySubtitle: string;
  emptyTitle: string;
  from: string;
  ranges: Record<RangeKey, string>;
  title: string;
  to: string;
  updated: string;
}

export function useDashboardTrendsLabels(t: TFunction<"dashboard">): DashboardTrendsLabels {
  return useMemo<DashboardTrendsLabels>(
    () => ({
      apply: String(t("common.apply", { defaultValue: "Apply" })),
      cancel: String(t("common.cancel", { defaultValue: "Cancel" })),
      created: String(t("trends.created", { defaultValue: "Created" })),
      customRange: String(t("range.custom", { defaultValue: "Custom" })),
      customTitle: String(t("range.customTitle", { defaultValue: "Custom period" })),
      emptySubtitle: String(
        t("trends.emptySubtitle", {
          defaultValue: "Add jobs and update statuses to see trends here.",
        }),
      ),
      emptyTitle: String(t("trends.emptyTitle", { defaultValue: "No data yet" })),
      from: String(t("range.from", { defaultValue: "From" })),
      ranges: {
        "7d": String(t("range.7d", { defaultValue: "7d" })),
        "30d": String(t("range.30d", { defaultValue: "30d" })),
        "90d": String(t("range.90d", { defaultValue: "90d" })),
        "12m": String(t("range.12m", { defaultValue: "12m" })),
        custom: String(t("range.custom", { defaultValue: "Custom" })),
      },
      title: String(t("trends.title", { defaultValue: "Trends" })),
      to: String(t("range.to", { defaultValue: "To" })),
      updated: String(t("trends.updated", { defaultValue: "Updated" })),
    }),
    [t],
  );
}
