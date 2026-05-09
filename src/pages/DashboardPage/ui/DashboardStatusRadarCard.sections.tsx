import type { BoardColumnKey } from "src/entities/application";
import { Card } from "src/shared/ui";
import { RadarChart, type RadarAxis, type RadarSeries } from "src/shared/ui";

import type { DashboardStatusRadarPercent } from "./DashboardStatusRadarCard.helpers";
import type { DashboardStatusRadarLabels } from "./useDashboardStatusRadarCardController";

interface DashboardStatusRadarCardLayoutProps {
  axes: RadarAxis<BoardColumnKey>[];
  labels: DashboardStatusRadarLabels;
  percents: DashboardStatusRadarPercent[];
  series: RadarSeries<BoardColumnKey>[];
}

interface RadarPercentGridProps {
  percents: DashboardStatusRadarPercent[];
}

export function DashboardStatusRadarCardLayout({
  axes,
  labels,
  percents,
  series,
}: DashboardStatusRadarCardLayoutProps) {
  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">{labels.title}</div>
      <div className="text-xs text-muted-foreground">{labels.subtitle}</div>

      <div className="mt-5 flex items-center justify-center">
        <RadarChart size={240} axes={axes} series={series} />
      </div>

      <RadarPercentGrid percents={percents} />
    </Card>
  );
}

function RadarPercentGrid({ percents }: RadarPercentGridProps) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
      {percents.map((percent) => (
        <RadarPercentItem key={percent.column} percent={percent} />
      ))}
    </div>
  );
}

function RadarPercentItem({ percent }: { percent: DashboardStatusRadarPercent }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <span
          className="inline-block h-2.5 w-2.5 rounded-full"
          style={{ backgroundColor: percent.color }}
        />
        <span className="text-muted-foreground">{percent.label}</span>
      </div>
      <div className="tabular-nums text-foreground">{Math.round(percent.value * 100)}%</div>
    </div>
  );
}
