import type { MatchTimestampsLike } from "../../model/dashboardTimeSeries";

import { DashboardTrendsCardLayout } from "./DashboardTrendsCard.sections";
import type { CustomRange, ModeKey, RangeKey } from "./trends.types";
import { useDashboardTrendsCardController } from "./useDashboardTrendsCardController";

interface DashboardTrendsCardProps {
  customRange: CustomRange;
  matches: MatchTimestampsLike[];
  mode: ModeKey;
  onCustomRangeChange: (range: CustomRange) => void;
  onModeChange: (mode: ModeKey) => void;
  onRangeChange: (range: RangeKey) => void;
  range: RangeKey;
}

export function DashboardTrendsCard(props: DashboardTrendsCardProps) {
  const trends = useDashboardTrendsCardController(props);

  return <DashboardTrendsCardLayout trends={trends} />;
}
