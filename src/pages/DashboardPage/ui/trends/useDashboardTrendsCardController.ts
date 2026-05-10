import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { MatchTimestampsLike } from "../../model/dashboardTimeSeries";

import {
  INITIAL_VISIBLE_SERIES,
  buildTrendsSubtitle,
  getCustomRangeMs,
  toSafeTrendMatches,
} from "./trends.helpers";
import type {
  CustomRange,
  ModeKey,
  RangeKey,
  SeriesKey,
  TrendsPoint,
  VisibleMap,
} from "./trends.types";
import { useDashboardTrendsCustomRange } from "./useDashboardTrendsCustomRange";
import {
  type DashboardTrendsLabels,
  useDashboardTrendsLabels,
} from "./useDashboardTrendsLabels";
import { useTrendsBuckets, useTrendsChartData, useTrendsTotal } from "./useTrendsData";

export interface DashboardTrendsCardControllerParams {
  customRange: CustomRange;
  matches: MatchTimestampsLike[];
  mode: ModeKey;
  onCustomRangeChange: (range: CustomRange) => void;
  onModeChange: (mode: ModeKey) => void;
  onRangeChange: (range: RangeKey) => void;
  range: RangeKey;
}

export interface DashboardTrendsChartData {
  points: TrendsPoint[];
}

export interface DashboardTrendsCardViewModel {
  chartData: DashboardTrendsChartData;
  customOpen: boolean;
  draftFrom: string;
  draftTo: string;
  hoverKey: SeriesKey | null;
  labels: DashboardTrendsLabels;
  mode: ModeKey;
  onApplyCustom: () => void;
  onCustomOpenChange: (open: boolean) => void;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  onHoverSeries: (key: SeriesKey | null) => void;
  onModeChange: (mode: ModeKey) => void;
  onOpenCustom: () => void;
  onRangeChange: (range: RangeKey) => void;
  onToggleSeries: (key: SeriesKey) => void;
  range: RangeKey;
  subtitle: string;
  totalInRange: number;
  visible: VisibleMap;
}

export function useDashboardTrendsCardController({
  customRange,
  matches,
  mode,
  onCustomRangeChange,
  onModeChange,
  onRangeChange,
  range,
}: DashboardTrendsCardControllerParams): DashboardTrendsCardViewModel {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const [visible, setVisible] = useState<VisibleMap>(() => ({ ...INITIAL_VISIBLE_SERIES }));
  const [hoverKey, setHoverKey] = useState<SeriesKey | null>(null);

  const safeMatches = useMemo(() => toSafeTrendMatches(matches), [matches]);
  const customMs = useMemo(() => getCustomRangeMs(range, customRange), [range, customRange]);

  const buckets = useTrendsBuckets(safeMatches, range, mode, customMs);
  const chartData = useTrendsChartData(buckets, i18n.language);
  const totalInRange = useTrendsTotal(buckets);

  const labels = useDashboardTrendsLabels(t);
  const customRangeState = useDashboardTrendsCustomRange({
    customRange,
    onCustomRangeChange,
    onRangeChange,
  });

  const subtitle = useMemo(() => {
    const modeLabel =
      mode === "updated"
        ? String(t("trends.mode.updated", { defaultValue: "By last update" }))
        : String(t("trends.mode.created", { defaultValue: "By creation date" }));

    return buildTrendsSubtitle({
      customRange,
      language: i18n.language,
      modeLabel,
      range,
      rangeLabel: labels.ranges[range],
    });
  }, [customRange, i18n.language, labels.ranges, mode, range, t]);

  const toggleSeries = useCallback((key: SeriesKey) => {
    setVisible((current) => ({ ...current, [key]: !current[key] }));
  }, []);

  return {
    chartData,
    customOpen: customRangeState.customOpen,
    draftFrom: customRangeState.draftFrom,
    draftTo: customRangeState.draftTo,
    hoverKey,
    labels,
    mode,
    onApplyCustom: customRangeState.onApplyCustom,
    onCustomOpenChange: customRangeState.onCustomOpenChange,
    onDraftFromChange: customRangeState.onDraftFromChange,
    onDraftToChange: customRangeState.onDraftToChange,
    onHoverSeries: setHoverKey,
    onModeChange,
    onOpenCustom: customRangeState.onOpenCustom,
    onRangeChange,
    onToggleSeries: toggleSeries,
    range,
    subtitle,
    totalInRange,
    visible,
  };
}

export type { DashboardTrendsLabels } from "./useDashboardTrendsLabels";
