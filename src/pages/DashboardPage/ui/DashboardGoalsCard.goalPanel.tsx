import type {
  DashboardGoalsCardViewModel,
  DashboardGoalsLabels,
} from "./useDashboardGoalsCardController";

type GoalPanelProps = Pick<
  DashboardGoalsCardViewModel,
  "applied" | "goal" | "labels" | "onDecreaseGoal" | "onIncreaseGoal" | "progressPct" | "streak"
>;

interface GoalStepperProps {
  goal: number;
  labels: Pick<DashboardGoalsLabels, "decrease" | "increase">;
  onDecreaseGoal: () => void;
  onIncreaseGoal: () => void;
}

interface GoalAdjustButtonProps {
  ariaLabel: string;
  children: string;
  onClick: () => void;
}

interface GoalProgressProps {
  applied: number;
  goal: number;
  labels: Pick<DashboardGoalsLabels, "days" | "progress" | "streak">;
  progressPct: number;
  streak: number;
}

export function GoalPanel({
  applied,
  goal,
  labels,
  onDecreaseGoal,
  onIncreaseGoal,
  progressPct,
  streak,
}: GoalPanelProps) {
  return (
    <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs text-muted-foreground">{labels.appliedGoal}</div>

        <GoalStepper
          goal={goal}
          labels={labels}
          onDecreaseGoal={onDecreaseGoal}
          onIncreaseGoal={onIncreaseGoal}
        />
      </div>

      <GoalProgress
        applied={applied}
        goal={goal}
        labels={labels}
        progressPct={progressPct}
        streak={streak}
      />
    </div>
  );
}

function GoalStepper({ goal, labels, onDecreaseGoal, onIncreaseGoal }: GoalStepperProps) {
  return (
    <div className="flex items-center gap-2">
      <GoalAdjustButton ariaLabel={labels.decrease} onClick={onDecreaseGoal}>
        -
      </GoalAdjustButton>
      <div className="min-w-[64px] text-center text-sm font-semibold text-foreground">{goal}</div>
      <GoalAdjustButton ariaLabel={labels.increase} onClick={onIncreaseGoal}>
        +
      </GoalAdjustButton>
    </div>
  );
}

function GoalAdjustButton({ ariaLabel, children, onClick }: GoalAdjustButtonProps) {
  return (
    <button
      type="button"
      className="h-8 w-8 rounded-full border border-border bg-background text-sm text-foreground hover:bg-muted"
      onClick={onClick}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}

function GoalProgress({ applied, goal, labels, progressPct, streak }: GoalProgressProps) {
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {labels.progress}:{" "}
          <span className="text-foreground font-medium">
            {applied}/{goal}
          </span>
        </span>
        <span className="text-foreground font-medium">{progressPct}%</span>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-foreground/70" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="mt-3 text-xs text-muted-foreground">
        {labels.streak}:{" "}
        <span className="text-foreground font-medium">
          {streak} {labels.days}
        </span>
      </div>
    </div>
  );
}
