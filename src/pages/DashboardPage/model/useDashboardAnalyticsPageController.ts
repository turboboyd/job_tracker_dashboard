import { useMemo, useState } from "react";

import type { CustomRange, ModeKey, RangeKey } from "../ui/trends/trends.types";

import { filterDashboardAnalyticsMatches } from "./dashboardAnalytics.helpers";
import { useDashboardData } from "./useDashboardData";

export function useDashboardAnalyticsPageController() {
  const dashboard = useDashboardData();
  const [loopsModalOpen, setLoopsModalOpen] = useState(false);
  const [nowMs] = useState(() => Date.now());
  const [range, setRange] = useState<RangeKey>("7d");
  const [mode, setMode] = useState<ModeKey>("created");
  const [customRange, setCustomRange] = useState<CustomRange>(null);

  const filteredMatches = useMemo(
    () =>
      filterDashboardAnalyticsMatches(
        dashboard.chartMatches,
        range,
        mode,
        customRange,
        nowMs,
      ),
    [customRange, dashboard.chartMatches, mode, nowMs, range],
  );

  return {
    customRange,
    dashboard,
    filteredMatches,
    loopsModalOpen,
    mode,
    range,
    setCustomRange,
    setLoopsModalOpen,
    setMode,
    setRange,
  };
}
