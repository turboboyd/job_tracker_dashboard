import { Card } from "src/shared/ui/Card";

import {
  TrendsChartPanel,
  TrendsLegendPanel,
} from "./DashboardTrendsCard.chartPanel";
import { TrendsHeader } from "./DashboardTrendsCard.controls";
import { CustomRangeModal } from "./DashboardTrendsCard.customRange";
import type { DashboardTrendsCardViewModel } from "./useDashboardTrendsCardController";

interface DashboardTrendsCardLayoutProps {
  trends: DashboardTrendsCardViewModel;
}

export function DashboardTrendsCardLayout({
  trends,
}: DashboardTrendsCardLayoutProps) {
  return (
    <Card className="p-6">
      <TrendsHeader
        labels={trends.labels}
        mode={trends.mode}
        onModeChange={trends.onModeChange}
        onOpenCustom={trends.onOpenCustom}
        onRangeChange={trends.onRangeChange}
        range={trends.range}
        subtitle={trends.subtitle}
      />

      <CustomRangeModal
        customOpen={trends.customOpen}
        draftFrom={trends.draftFrom}
        draftTo={trends.draftTo}
        labels={trends.labels}
        onApplyCustom={trends.onApplyCustom}
        onCustomOpenChange={trends.onCustomOpenChange}
        onDraftFromChange={trends.onDraftFromChange}
        onDraftToChange={trends.onDraftToChange}
      />

      <TrendsChartPanel
        chartData={trends.chartData}
        hoverKey={trends.hoverKey}
        labels={trends.labels}
        mode={trends.mode}
        totalInRange={trends.totalInRange}
        visible={trends.visible}
      />

      <TrendsLegendPanel
        hoverKey={trends.hoverKey}
        onHoverSeries={trends.onHoverSeries}
        onToggleSeries={trends.onToggleSeries}
        totalInRange={trends.totalInRange}
        visible={trends.visible}
      />
    </Card>
  );
}
