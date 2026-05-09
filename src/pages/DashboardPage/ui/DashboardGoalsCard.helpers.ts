import type { StatusKey } from "src/entities/application";

import type { Bucket } from "../model/dashboardTimeSeries";

export type DashboardGoalRange = "7d" | "30d";

export const DASHBOARD_GOAL_RANGES: DashboardGoalRange[] = ["7d", "30d"];

const APPLIED_GOAL_STATUS: StatusKey = "APPLIED";
const DEFAULT_APPLIED_GOAL = 10;
const GOAL_STORAGE_KEY = "dashboard:goals:weeklyApplied:v1";
const MAX_APPLIED_GOAL = 100;
const MIN_APPLIED_GOAL = 1;

export function clampAppliedGoal(value: number): number {
  return Math.max(MIN_APPLIED_GOAL, Math.min(MAX_APPLIED_GOAL, Math.trunc(value)));
}

export function getGoalRangeDays(range: DashboardGoalRange): number {
  return range === "7d" ? 7 : 30;
}

export function readStoredAppliedGoal(): number {
  try {
    const raw = getLocalStorage()?.getItem(GOAL_STORAGE_KEY);
    if (!raw) return DEFAULT_APPLIED_GOAL;

    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_APPLIED_GOAL;

    return clampAppliedGoal(parsed);
  } catch {
    return DEFAULT_APPLIED_GOAL;
  }
}

export function writeStoredAppliedGoal(goal: number): void {
  try {
    getLocalStorage()?.setItem(GOAL_STORAGE_KEY, String(clampAppliedGoal(goal)));
  } catch {
    // Storage can be unavailable in private mode or server-side rendering.
  }
}

export function countAppliedApplications(buckets: Bucket[]): number {
  return buckets.reduce((total, bucket) => total + (bucket.counts[APPLIED_GOAL_STATUS] ?? 0), 0);
}

export function calculateGoalProgress(applied: number, goal: number): number {
  if (goal <= 0) return 0;

  return Math.max(0, Math.min(100, Math.round((applied / goal) * 100)));
}

export function calculateAppliedStreak(buckets: Bucket[]): number {
  let streak = 0;

  for (let index = buckets.length - 1; index >= 0; index -= 1) {
    const bucket = buckets[index];
    const applied = bucket?.counts[APPLIED_GOAL_STATUS] ?? 0;

    if (applied <= 0) break;
    streak += 1;
  }

  return streak;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  return window.localStorage;
}
