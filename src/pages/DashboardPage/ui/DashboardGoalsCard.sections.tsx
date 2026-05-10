import { Card } from "src/shared/ui";

import { GoalPanel } from "./DashboardGoalsCard.goalPanel";
import { DashboardGoalsHeader } from "./DashboardGoalsCard.header";
import type { DashboardGoalsCardViewModel } from "./useDashboardGoalsCardController";

export function DashboardGoalsCardLayout({
  applied,
  goal,
  labels,
  onDecreaseGoal,
  onIncreaseGoal,
  onRangeChange,
  progressPct,
  range,
  streak,
}: DashboardGoalsCardViewModel) {
  return (
    <Card className="p-6">
      <DashboardGoalsHeader labels={labels} range={range} onRangeChange={onRangeChange} />

      <GoalPanel
        applied={applied}
        goal={goal}
        labels={labels}
        onDecreaseGoal={onDecreaseGoal}
        onIncreaseGoal={onIncreaseGoal}
        progressPct={progressPct}
        streak={streak}
      />
    </Card>
  );
}
