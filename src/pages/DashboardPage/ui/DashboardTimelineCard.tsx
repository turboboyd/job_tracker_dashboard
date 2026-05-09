import type { DashboardTimelineMatch } from "./DashboardTimelineCard.helpers";
import { DashboardTimelineCardLayout } from "./DashboardTimelineCard.sections";
import { useDashboardTimelineCardController } from "./useDashboardTimelineCardController";

interface DashboardTimelineCardProps {
  className?: string | undefined;
  days?: number;
  matches: DashboardTimelineMatch[];
}

export function DashboardTimelineCard({
  className,
  days = 14,
  matches,
}: DashboardTimelineCardProps) {
  const timeline = useDashboardTimelineCardController({ days, matches });

  return <DashboardTimelineCardLayout className={className} timeline={timeline} />;
}
