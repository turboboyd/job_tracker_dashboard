import type { MatchTimestampsLike } from "../model/dashboardTimeSeries";

import { DashboardGoalsCardLayout } from "./DashboardGoalsCard.sections";
import { useDashboardGoalsCardController } from "./useDashboardGoalsCardController";

interface DashboardGoalsCardProps {
  matches: MatchTimestampsLike[];
}

export function DashboardGoalsCard({ matches }: DashboardGoalsCardProps) {
  const goals = useDashboardGoalsCardController(matches);

  return <DashboardGoalsCardLayout {...goals} />;
}
