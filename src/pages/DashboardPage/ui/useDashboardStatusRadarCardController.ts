import { useMemo } from "react";

import {
  buildDashboardStatusRadarAxes,
  buildDashboardStatusRadarPercents,
  buildDashboardStatusRadarSeries,
  buildDashboardStatusRadarValues,
  type DashboardStatusRadarMatch,
} from "./DashboardStatusRadarCard.helpers";
import { useDashboardTranslate } from "./useDashboardTranslate";

export interface DashboardStatusRadarLabels {
  subtitle: string;
  title: string;
}

export function useDashboardStatusRadarCardController(matches: DashboardStatusRadarMatch[]) {
  const translate = useDashboardTranslate();

  const labels = useMemo<DashboardStatusRadarLabels>(
    () => ({
      subtitle: translate("radar.subtitle", "Share by stage"),
      title: translate("radar.title", "Pipeline mix"),
    }),
    [translate],
  );

  const axes = useMemo(() => buildDashboardStatusRadarAxes(translate), [translate]);
  const values = useMemo(() => buildDashboardStatusRadarValues(matches), [matches]);
  const series = useMemo(
    () => buildDashboardStatusRadarSeries(values, translate("radar.mix", "Mix")),
    [translate, values],
  );
  const percents = useMemo(
    () => buildDashboardStatusRadarPercents(values, translate),
    [translate, values],
  );

  return {
    axes,
    labels,
    percents,
    series,
  };
}
