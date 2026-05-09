import { DASHBOARD_GOAL_RANGES } from "./DashboardGoalsCard.helpers";
import type { DashboardGoalsCardViewModel } from "./useDashboardGoalsCardController";

type DashboardGoalsHeaderProps = Pick<
  DashboardGoalsCardViewModel,
  "labels" | "onRangeChange" | "range"
>;

interface GoalRangeButtonProps {
  active: boolean;
  label: string;
  onClick: () => void;
}

export function DashboardGoalsHeader({
  labels,
  onRangeChange,
  range,
}: DashboardGoalsHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <div className="text-sm font-semibold text-foreground">{labels.title}</div>
        <div className="mt-1 text-xs text-muted-foreground">{labels.subtitle}</div>
      </div>

      <div className="flex items-center gap-2">
        {DASHBOARD_GOAL_RANGES.map((goalRange) => (
          <GoalRangeButton
            key={goalRange}
            active={range === goalRange}
            label={labels.ranges[goalRange]}
            onClick={() => onRangeChange(goalRange)}
          />
        ))}
      </div>
    </div>
  );
}

function GoalRangeButton({ active, label, onClick }: GoalRangeButtonProps) {
  return (
    <button
      type="button"
      className={[
        "rounded-full border px-3 py-1 text-xs transition",
        active ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/60",
      ].join(" ")}
      onClick={onClick}
    >
      {label}
    </button>
  );
}
