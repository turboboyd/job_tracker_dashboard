import type { ApplicationsRepo } from "src/features/applications";
import { getErrorMessage } from "src/shared/lib";

import type { AppRow, CreateFormState, PipelineFilterStatus, ViewMode } from "./types";

const ALL_APPLICATIONS_LIMIT = 500;
const DEFAULT_APPLICATIONS_LIMIT = 50;

interface LoadApplicationsListParams {
  activeStatus: PipelineFilterStatus;
  repo: ApplicationsRepo;
  userId: string;
  view: ViewMode;
}

type ApplicationListQuery = () => Promise<AppRow[]>;

export function canSubmitApplicationForm(form: CreateFormState): boolean {
  return form.companyName.trim().length > 0 && form.roleTitle.trim().length > 0;
}

export function buildCreateApplicationPayload(
  form: CreateFormState,
): Parameters<ApplicationsRepo["createApplication"]>[1] {
  const vacancyUrl = toOptionalTrimmed(form.vacancyUrl);
  const source = toOptionalTrimmed(form.source);
  const rawDescription = toOptionalTrimmed(form.rawDescription);

  return {
    companyName: form.companyName.trim(),
    roleTitle: form.roleTitle.trim(),
    ...(vacancyUrl ? { vacancyUrl } : {}),
    ...(source ? { source } : {}),
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
  activeStatus,
  repo,
  userId,
  view,
  onUpdate,
  onError,
}: SubscribeApplicationsListParams): () => void {
  if (view === "today") {
    return repo.subscribeTodayTopPriority(
      userId,
      DEFAULT_APPLICATIONS_LIMIT,
      onUpdate,
      onError,
    );
  }

  if (view === "followups") {
    return repo.subscribeFollowUpsDue(
      userId,
      DEFAULT_APPLICATIONS_LIMIT,
      onUpdate,
      onError,
    );
  }

  if (activeStatus === "ALL") {
    return repo.subscribeAllActiveApplications(
      userId,
      ALL_APPLICATIONS_LIMIT,
      onUpdate,
      onError,
    );
  }

  return repo.subscribePipelineByStatus(
    userId,
    activeStatus,
    DEFAULT_APPLICATIONS_LIMIT,
    onUpdate,
    onError,
  );
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
    return () => repo.queryTodayTopPriority(userId, DEFAULT_APPLICATIONS_LIMIT);
  }

  if (view === "followups") {
    return () => repo.queryFollowUpsDue(userId, DEFAULT_APPLICATIONS_LIMIT);
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
