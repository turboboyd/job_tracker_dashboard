import { Card, DonutChart } from "src/shared/ui";

import type { DashboardPipelineSlice } from "./DashboardPipelineCard.helpers";
import type { DashboardPipelineLabels } from "./useDashboardPipelineCardController";

interface DashboardPipelineCardLayoutProps {
  centerBottom: string;
  labels: DashboardPipelineLabels;
  size: number;
  slices: DashboardPipelineSlice[];
  stroke: number;
}

export function DashboardPipelineCardLayout({
  centerBottom,
  labels,
  size,
  slices,
  stroke,
}: DashboardPipelineCardLayoutProps) {
  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">{labels.title}</div>

      <div className="mt-5 flex items-center justify-center">
        <DonutChart
          title={labels.chartTitle}
          totalLabel={labels.totalLabel}
          size={size}
          stroke={stroke}
          slices={slices}
          centerTop={labels.total}
          centerBottom={centerBottom}
        />
      </div>
    </Card>
  );
}
