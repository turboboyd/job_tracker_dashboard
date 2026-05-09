import type { DashboardPipelineSummary } from "./DashboardPipelineCard.helpers";
import { DashboardPipelineCardLayout } from "./DashboardPipelineCard.sections";
import { useDashboardPipelineCardController } from "./useDashboardPipelineCardController";

interface DashboardPipelineCardProps {
  size: number;
  stroke: number;
  summary: DashboardPipelineSummary;
}

export function DashboardPipelineCard({ size, stroke, summary }: DashboardPipelineCardProps) {
  const pipeline = useDashboardPipelineCardController(summary);

  return (
    <DashboardPipelineCardLayout
      centerBottom={pipeline.centerBottom}
      labels={pipeline.labels}
      size={size}
      slices={pipeline.slices}
      stroke={stroke}
    />
  );
}
