import type { DashboardInsightMatch } from "./DashboardInsightsCard.helpers";
import { DashboardInsightsCardLayout } from "./DashboardInsightsCard.sections";
import { useDashboardInsightsCardController } from "./useDashboardInsightsCardController";

interface DashboardInsightsCardProps {
  matches: DashboardInsightMatch[];
}

export function DashboardInsightsCard({ matches }: DashboardInsightsCardProps) {
  const insights = useDashboardInsightsCardController(matches);

  return <DashboardInsightsCardLayout kpis={insights.kpis} title={insights.title} />;
}
