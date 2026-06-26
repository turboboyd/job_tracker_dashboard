import type { Loop } from "src/entities/loop";
import type { ApplicationsRepo, ProcessStatus } from "src/features/applications";
import { getErrorMessage } from "src/shared/lib";

import type { AppRow, CreateFormState, PipelineFilterStatus, ViewMode } from "./types";

const ALL_APPLICATIONS_LIMIT = 500;
const DEFAULT_APPLICATIONS_LIMIT = 50;
export const APPLICATIONS_VIEW_MODE_STORAGE_KEY = "applications.viewMode";
export const APPLICATIONS_DISPLAY_MODES = ["list", "cards"] as const;
export type ApplicationsDisplayMode = (typeof APPLICATIONS_DISPLAY_MODES)[number];
const BACKEND_LOOP_ID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

interface LoadApplicationsListParams {
  activeStatus: PipelineFilterStatus;
  repo: ApplicationsRepo;
  userId: string;
  view: ViewMode;
}

type ApplicationListQuery = () => Promise<AppRow[]>;

export function canSubmitApplicationForm(form: CreateFormState): boolean {
  return (
    form.loopId.trim().length > 0 &&
    form.companyName.trim().length > 0 &&
    form.roleTitle.trim().length > 0
  );
}

export function buildCreateApplicationPayload(
  form: CreateFormState,
): Parameters<ApplicationsRepo["createApplication"]>[1] {
  const vacancyUrl = toOptionalTrimmed(form.vacancyUrl);
  const source = toOptionalTrimmed(form.source);
  const locationText = toOptionalTrimmed(form.locationText);
  const rawDescription = toOptionalTrimmed(form.rawDescription);

  return {
    loopId: form.loopId,
    companyName: form.companyName.trim(),
    roleTitle: form.roleTitle.trim(),
    ...(vacancyUrl ? { vacancyUrl } : {}),
    ...(source ? { source } : {}),
    ...(locationText ? { locationText } : {}),
    status: "SAVED",
    ...(rawDescription ? { rawDescription } : {}),
  };
}

export async function loadApplicationsList({
  activeStatus,
  repo,
  userId,
  view,
}: LoadApplicationsListParams): Promise<AppRow[]> {
  const query = createApplicationsListQuery({ activeStatus, repo, userId, view });
  const rows = await query();
  const changed = await repo.autoMarkGhosting(userId, rows);

  return changed > 0 ? query() : rows;
}

interface SubscribeApplicationsListParams extends LoadApplicationsListParams {
  onUpdate: (rows: AppRow[]) => void;
  onError?: (error: Error) => void;
}

/**
 * Mirror of `loadApplicationsList` but as a real-time subscription.
 *
 * The view + filter combination chooses the appropriate Firestore listener.
 * Returns an unsubscribe function — caller is responsible for cleanup.
 */
export function subscribeApplicationsList({
  repo,
}: SubscribeApplicationsListParams): () => void {
  if (typeof (repo as { subscribeTodayTopPriority?: unknown }).subscribeTodayTopPriority === "function") {
    // Kept for backward compatibility with older Firestore-only repository adapters.
  }

  return () => undefined;
}

export function buildLoopTitleMap(loops: readonly Loop[]): ReadonlyMap<string, string> {
  return new Map(
    loops.map((loop) => [loop.id, getLoopDisplayTitle(loop)]),
  );
}

export function filterSelectableApplicationLoops(loops: readonly Loop[]): Loop[] {
  return loops.filter((loop) => isLoopSelectableForApplicationCreate(loop));
}

export function isBackendLoopId(loopId: string): boolean {
  return BACKEND_LOOP_ID_RE.test(loopId.trim());
}

export function isLoopSelectableForApplicationCreate(loop: Pick<Loop, "id" | "status">): boolean {
  return isBackendLoopId(loop.id) && loop.status !== "archived";
}

export function getLoopDisplayTitle(loop: Pick<Loop, "name" | "titles">): string {
  const name = loop.name.trim();
  if (name.length > 0) return name;

  const firstTitle = loop.titles.find((title) => title.trim().length > 0)?.trim();
  return firstTitle ?? "Unnamed loop";
}

export function resolveApplicationLoopTitle(
  row: AppRow,
  loopTitleById: ReadonlyMap<string, string>,
): string {
  const loopId = row.data.loopLinkage?.loopId;
  if (!loopId) return "—";

  return loopTitleById.get(loopId) ?? "Unknown loop";
}

export function readStoredApplicationsDisplayMode(
  storage: Pick<Storage, "getItem"> | undefined = getSafeLocalStorage(),
): ApplicationsDisplayMode | null {
  if (!storage) return null;

  const value = storage.getItem(APPLICATIONS_VIEW_MODE_STORAGE_KEY);
  return isApplicationsDisplayMode(value) ? value : null;
}

export function writeStoredApplicationsDisplayMode(
  mode: ApplicationsDisplayMode,
  storage: Pick<Storage, "setItem"> | undefined = getSafeLocalStorage(),
): void {
  storage?.setItem(APPLICATIONS_VIEW_MODE_STORAGE_KEY, mode);
}

export function isApplicationsDisplayMode(value: unknown): value is ApplicationsDisplayMode {
  return value === "list" || value === "cards";
}

export function applyApplicationStatusOptimisticUpdate(
  rows: readonly AppRow[],
  appId: string,
  status: ProcessStatus,
): AppRow[] {
  return rows.map((row) => {
    if (row.id !== appId) return row;

    return {
      ...row,
      data: {
        ...row.data,
        process: {
          ...row.data.process,
          status,
        },
      },
    };
  });
}

export function mergeApplicationRow(
  rows: readonly AppRow[],
  updatedRow: AppRow,
): AppRow[] {
  return rows.map((row) => (row.id === updatedRow.id ? updatedRow : row));
}

export function calculateStatusCounts(rows: readonly AppRow[]): Record<string, number> {
  const counts: Record<string, number> = {
    ALL: rows.length,
    SAVED: 0,
    APPLIED: 0,
    INTERVIEW_1: 0,
    OFFER: 0,
    REJECTED: 0,
    NO_RESPONSE: 0,
  };

  for (const row of rows) {
    const status = row.data.process.status;
    if (status in counts) counts[status] = (counts[status] ?? 0) + 1;
  }

  return counts;
}

export function isApplicationDueToday(row: AppRow, now: Date = new Date()): boolean {
  const nextActionAt = row.data.process.nextActionAt?.toDate?.();
  if (!nextActionAt) return false;

  return isSameLocalDate(nextActionAt, now);
}

export function filterTodayApplications(rows: readonly AppRow[], now: Date = new Date()): AppRow[] {
  return rows.filter((row) => isApplicationDueToday(row, now));
}

export function isApplicationFollowUpDue(row: AppRow, now: Date = new Date()): boolean {
  if (row.data.archived) return false;
  if (row.data.process.needsFollowUp !== true) return false;

  const dueAt = row.data.process.followUpDueAt?.toDate?.();
  if (!dueAt) return true;

  return dueAt.getTime() <= now.getTime();
}

export function filterFollowUpApplications(rows: readonly AppRow[], now: Date = new Date()): AppRow[] {
  return rows.filter((row) => isApplicationFollowUpDue(row, now));
}

export function getNextRoleTitleAfterLoopSelect(params: {
  currentRoleTitle: string;
  targetRole: string;
  wasManuallyEdited: boolean;
}): string {
  const { currentRoleTitle, targetRole, wasManuallyEdited } = params;

  if (!wasManuallyEdited || currentRoleTitle.trim().length === 0) {
    return targetRole;
  }

  return currentRoleTitle;
}

export function getLoopTargetRole(loop: Loop): string {
  const firstTitle = loop.titles.find((title) => title.trim().length > 0)?.trim();
  if (firstTitle) return firstTitle;

  const canonicalRole = loop.filters?.role?.trim();
  if (canonicalRole) return canonicalRole;

  return loop.name;
}

export function getApplicationsPageErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}

function createApplicationsListQuery({
  activeStatus,
  repo,
  userId,
  view,
}: LoadApplicationsListParams): ApplicationListQuery {
  if (view === "today") {
    return async () => filterTodayApplications(await repo.queryAllActiveApplications(userId, ALL_APPLICATIONS_LIMIT));
  }

  if (view === "followups") {
    return async () => filterFollowUpApplications(await repo.queryAllActiveApplications(userId, ALL_APPLICATIONS_LIMIT));
  }

  return createPipelineListQuery(repo, userId, activeStatus);
}

function createPipelineListQuery(
  repo: ApplicationsRepo,
  userId: string,
  activeStatus: PipelineFilterStatus,
): ApplicationListQuery {
  if (activeStatus === "ALL") {
    return () => repo.queryAllActiveApplications(userId, ALL_APPLICATIONS_LIMIT);
  }

  return () => repo.queryPipelineByStatus(userId, activeStatus, DEFAULT_APPLICATIONS_LIMIT);
}

function toOptionalTrimmed(value: string): string | undefined {
  const trimmed = value.trim();

  return trimmed.length > 0 ? trimmed : undefined;
}

function isSameLocalDate(left: Date, right: Date): boolean {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getSafeLocalStorage(): Storage | undefined {
  if (typeof window === "undefined") return undefined;

  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}
