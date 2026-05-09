import type { DashboardStatusRadarMatch } from "./DashboardStatusRadarCard.helpers";
import { DashboardStatusRadarCardLayout } from "./DashboardStatusRadarCard.sections";
import { useDashboardStatusRadarCardController } from "./useDashboardStatusRadarCardController";

interface DashboardStatusRadarCardProps {
  matches: DashboardStatusRadarMatch[];
}

export function DashboardStatusRadarCard({ matches }: DashboardStatusRadarCardProps) {
  const radar = useDashboardStatusRadarCardController(matches);

  return (
    <DashboardStatusRadarCardLayout
      axes={radar.axes}
      labels={radar.labels}
      percents={radar.percents}
      series={radar.series}
    />
  );
}
