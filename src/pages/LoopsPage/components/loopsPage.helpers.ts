import type { Loop, LoopStatus } from "src/entities/loop";
import type { AppRow } from "src/pages/ApplicationsPage/model/types";
import {
  isApplicationDueToday,
  isApplicationFollowUpDue,
} from "src/pages/ApplicationsPage/model/applicationsPage.helpers";

export interface LoopStats {
  applications: number;
  saved: number;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  today: number;
  followUps: number;
  matches: number;
}

export type LoopStatsById = ReadonlyMap<string, LoopStats>;

export const DEFAULT_LOOP_STATS: LoopStats = {
  applications: 0,
  saved: 0,
  applied: 0,
  interview: 0,
  offer: 0,
  rejected: 0,
  today: 0,
  followUps: 0,
  matches: 0,
};

const APPLIED_STATUSES = new Set(["APPLIED"]);
const INTERVIEW_STATUSES = new Set(["INTERVIEW_1", "INTERVIEW_2", "TEST_TASK"]);
const OFFER_STATUSES = new Set(["OFFER"]);
const REJECTED_STATUSES = new Set(["REJECTED", "NO_RESPONSE", "WITHDREW"]);

const BACKEND_LOOP_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBackendLoopId(loopId: string): boolean {
  return BACKEND_LOOP_ID_RE.test(loopId.trim());
}

export function getBackendLoopIdsForMatchLoading(loops: readonly Pick<Loop, "id">[]): string[] {
  return loops
    .map((loop) => loop.id)
    .filter(isBackendLoopId)
    .sort();
}

export function getLoopStatus(loop: Pick<Loop, "status">): LoopStatus {
  return loop.status ?? "active";
}

export function isLoopArchived(loop: Pick<Loop, "status">): boolean {
  return getLoopStatus(loop) === "archived";
}

export function isLoopPaused(loop: Pick<Loop, "status">): boolean {
  return getLoopStatus(loop) === "paused";
}

export function filterLoopsByArchiveTab(
  loops: readonly Loop[],
  tab: "active" | "archive",
): Loop[] {
  return loops.filter((loop) => {
    const archived = isLoopArchived(loop);
    if (tab === "archive") return archived;
    return !archived;
  });
}

export function isApplicationSaved(row: AppRow): boolean {
  return row.data.process.status === "SAVED";
}

export function isApplicationApplied(row: AppRow): boolean {
  return APPLIED_STATUSES.has(row.data.process.status);
}

export function isApplicationInterview(row: AppRow): boolean {
  return INTERVIEW_STATUSES.has(row.data.process.status) || row.data.process.stage === "INTERVIEW";
}

export function isApplicationOffer(row: AppRow): boolean {
  return OFFER_STATUSES.has(row.data.process.status) || row.data.process.stage === "OFFER";
}

export function isApplicationRejected(row: AppRow): boolean {
  return REJECTED_STATUSES.has(row.data.process.status) || row.data.process.stage === "REJECTED";
}

export type LoopMatchStatsSource = {
  loopId: string;
  status?: string | null;
};

function isActionableMatchStatus(status: string | null | undefined): boolean {
  const normalized = status?.toLowerCase();
  return normalized === "new" || normalized === "saved";
}

function createInitialStats(loops: readonly Loop[]): Map<string, LoopStats> {
  return new Map(loops.map((loop) => [loop.id, { ...DEFAULT_LOOP_STATS }]));
}

function applyMatchStats(
  stats: Map<string, LoopStats>,
  matches: readonly LoopMatchStatsSource[],
): void {
  for (const match of matches) {
    if (!isActionableMatchStatus(match.status)) continue;

    const current = stats.get(match.loopId);
    if (current) current.matches += 1;
  }
}

function applyApplicationStatusStats(current: LoopStats, row: AppRow): void {
  current.applications += 1;
  if (isApplicationSaved(row)) current.saved += 1;
  if (isApplicationApplied(row)) current.applied += 1;
  if (isApplicationInterview(row)) current.interview += 1;
  if (isApplicationOffer(row)) current.offer += 1;
  if (isApplicationRejected(row)) current.rejected += 1;
}

function applyApplicationTimeStats(current: LoopStats, row: AppRow, now: Date): void {
  if (isApplicationDueToday(row, now)) current.today += 1;
  if (isApplicationFollowUpDue(row, now)) current.followUps += 1;
}

function applyApplicationStats(
  stats: Map<string, LoopStats>,
  applications: readonly AppRow[],
  now: Date,
): void {
  for (const row of applications) {
    const loopId = row.data.loopLinkage?.loopId;
    if (!loopId) continue;

    const current = stats.get(loopId);
    if (!current) continue;

    applyApplicationStatusStats(current, row);
    applyApplicationTimeStats(current, row, now);
  }
}

export function buildLoopStatsById(params: {
  loops: readonly Loop[];
  applications: readonly AppRow[];
  matches: readonly LoopMatchStatsSource[];
  now?: Date;
}): LoopStatsById {
  const { loops, applications, matches, now = new Date() } = params;
  const stats = createInitialStats(loops);

  applyMatchStats(stats, matches);
  applyApplicationStats(stats, applications, now);

  return stats;
}

export function getLoopStats(statsById: LoopStatsById, loopId: string): LoopStats {
  return statsById.get(loopId) ?? DEFAULT_LOOP_STATS;
}

export function countLoopStats(statsById: LoopStatsById, loopIds: readonly string[]): LoopStats {
  return loopIds.reduce<LoopStats>(
    (total, loopId) => {
      const stats = getLoopStats(statsById, loopId);
      total.applications += stats.applications;
      total.saved += stats.saved;
      total.applied += stats.applied;
      total.interview += stats.interview;
      total.offer += stats.offer;
      total.rejected += stats.rejected;
      total.today += stats.today;
      total.followUps += stats.followUps;
      total.matches += stats.matches;
      return total;
    },
    { ...DEFAULT_LOOP_STATS },
  );
}

export function shouldShowLoopsPagination(totalLoops: number, pageSize = 10): boolean {
  return totalLoops > pageSize;
}
