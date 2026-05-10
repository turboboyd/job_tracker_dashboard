import type { TFunction } from "i18next";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  buildDailyBuckets,
  type Bucket,
  type MatchTimestampsLike,
} from "../model/dashboardTimeSeries";

import {
  calculateAppliedStreak,
  calculateGoalProgress,
  clampAppliedGoal,
  countAppliedApplications,
  getGoalRangeDays,
  readStoredAppliedGoal,
  writeStoredAppliedGoal,
  type DashboardGoalRange,
} from "./DashboardGoalsCard.helpers";

export interface DashboardGoalsLabels {
  appliedGoal: string;
  days: string;
  decrease: string;
  increase: string;
  progress: string;
  ranges: Record<DashboardGoalRange, string>;
  streak: string;
  subtitle: string;
  title: string;
}

export interface DashboardGoalsCardViewModel {
  applied: number;
  goal: number;
  labels: DashboardGoalsLabels;
  onDecreaseGoal: () => void;
  onIncreaseGoal: () => void;
  onRangeChange: (range: DashboardGoalRange) => void;
  progressPct: number;
  range: DashboardGoalRange;
  streak: number;
}

export function useDashboardGoalsCardController(
  matches: MatchTimestampsLike[],
): DashboardGoalsCardViewModel {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [goal, setGoal] = usePersistedAppliedGoal();
  const [range, setRange] = useState<DashboardGoalRange>("7d");
  const buckets = useDashboardGoalBuckets(matches, range, i18n.language);
  const { applied, progressPct, streak } = useDashboardGoalMetrics(buckets, goal);

  const labels = useMemo(() => buildDashboardGoalsLabels(t), [t]);

  const onDecreaseGoal = useCallback(() => {
    setGoal((current) => clampAppliedGoal(current - 1));
  }, [setGoal]);

  const onIncreaseGoal = useCallback(() => {
    setGoal((current) => clampAppliedGoal(current + 1));
  }, [setGoal]);

  return {
    applied,
    goal,
    labels,
    onDecreaseGoal,
    onIncreaseGoal,
    onRangeChange: setRange,
    progressPct,
    range,
    streak,
  };
}

function usePersistedAppliedGoal() {
  const [goal, setGoal] = useState(() => readStoredAppliedGoal());

  useEffect(() => {
    writeStoredAppliedGoal(goal);
  }, [goal]);

  return [goal, setGoal] as const;
}

function useDashboardGoalBuckets(
  matches: MatchTimestampsLike[],
  range: DashboardGoalRange,
  locale: string,
) {
  return useMemo(() => {
    return buildDailyBuckets(matches, {
      byUpdatedAt: false,
      days: getGoalRangeDays(range),
      locale,
    });
  }, [locale, matches, range]);
}

function useDashboardGoalMetrics(buckets: Bucket[], goal: number) {
  return useMemo(() => {
    const applied = countAppliedApplications(buckets);

    return {
      applied,
      progressPct: calculateGoalProgress(applied, goal),
      streak: calculateAppliedStreak(buckets),
    };
  }, [buckets, goal]);
}

function buildDashboardGoalsLabels(t: TFunction): DashboardGoalsLabels {
  return {
    appliedGoal: String(t("goals.weeklyApplied", { defaultValue: "Applied goal" })),
    days: String(t("goals.days", { defaultValue: "days" })),
    decrease: String(t("goals.decrease", { defaultValue: "Decrease" })),
    increase: String(t("goals.increase", { defaultValue: "Increase" })),
    progress: String(t("goals.progress", { defaultValue: "Progress" })),
    ranges: {
      "7d": String(t("range.7d", { defaultValue: "7d" })),
      "30d": String(t("range.30d", { defaultValue: "30d" })),
    },
    streak: String(t("goals.streak", { defaultValue: "Streak" })),
    subtitle: String(t("goals.subtitle", { defaultValue: "Stay consistent and track your progress" })),
    title: String(t("goals.title", { defaultValue: "Goals" })),
  };
}
