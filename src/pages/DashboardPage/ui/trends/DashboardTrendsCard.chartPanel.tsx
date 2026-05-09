import type { ModeKey, SeriesKey, VisibleMap } from "./trends.types";
import { TrendsChart } from "./TrendsChart";
import { TrendsLegend } from "./TrendsLegend";
import type {
  DashboardTrendsCardViewModel,
  DashboardTrendsChartData,
} from "./useDashboardTrendsCardController";

type TrendsChartPanelProps = Pick<
  DashboardTrendsCardViewModel,
  "chartData" | "hoverKey" | "labels" | "mode" | "totalInRange" | "visible"
>;

type TrendsLegendPanelProps = Pick<
  DashboardTrendsCardViewModel,
  "hoverKey" | "onHoverSeries" | "onToggleSeries" | "totalInRange" | "visible"
>;

interface TrendsEmptyStateProps {
  subtitle: string;
  title: string;
}

interface TrendsChartContainerProps {
  chartData: DashboardTrendsChartData;
  hoverKey: SeriesKey | null;
  mode: ModeKey;
  visible: VisibleMap;
}

function TrendsEmptyState({ subtitle, title }: TrendsEmptyStateProps) {
  return (
    <div className="mt-6 flex min-h-[260px] items-center justify-center rounded-2xl border bg-muted/20 px-6 py-10 text-center">
      <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{title}</div>
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      </div>
    </div>
  );
}

function TrendsChartContainer({
  chartData,
  hoverKey,
  mode,
  visible,
}: TrendsChartContainerProps) {
  return (
    <div className="mt-6 rounded-2xl border bg-background p-3">
      <TrendsChart
        points={chartData.points}
        mode={mode}
        visible={visible}
        hoverKey={hoverKey}
      />
    </div>
  );
}

export function TrendsChartPanel({
  chartData,
  hoverKey,
  labels,
  mode,
  totalInRange,
  visible,
}: TrendsChartPanelProps) {
  if (totalInRange === 0) {
    return (
      <TrendsEmptyState
        subtitle={labels.emptySubtitle}
        title={labels.emptyTitle}
      />
    );
  }

  return (
    <TrendsChartContainer
      chartData={chartData}
      hoverKey={hoverKey}
      mode={mode}
      visible={visible}
    />
  );
}

export function TrendsLegendPanel({
  hoverKey,
  onHoverSeries,
  onToggleSeries,
  totalInRange,
  visible,
}: TrendsLegendPanelProps) {
  if (totalInRange <= 0) return null;

  return (
    <TrendsLegend
      visible={visible}
      hoverKey={hoverKey}
      onToggle={onToggleSeries}
      onHover={onHoverSeries}
    />
  );
}
