import type { Firestore } from "firebase/firestore";

import {
  type ApplicationDoc,
  type ProcessStatus,
  createApplication,
  autoMarkGhosting,
  ensureUserDoc,
  queryAllActiveApplications,
  queryFollowUpsDue,
  queryPipelineByStatus,
  queryTodayTopPriority,
  getApplicationHistory,
} from "src/features/applications/firestoreApplications";

export type ApplicationsRepo = ReturnType<typeof createApplicationsRepo>;

/**
 * DI-friendly repository for ApplicationsPage.
 * The page (composition layer) injects Firestore; the model/hooks stay db-agnostic.
 */
export function createApplicationsRepo(db: Firestore) {
  return {
    ensureUserDoc: (userId: string) => ensureUserDoc(db, userId),

    createApplication: (
      userId: string,
      payload: Parameters<typeof createApplication>[2]
    ) => createApplication(db, userId, payload),

    queryPipelineByStatus: (
      userId: string,
      status: ProcessStatus,
      limit: number
    ) => queryPipelineByStatus(db, userId, status, limit),

    queryAllActiveApplications: (userId: string, limit: number) =>
      queryAllActiveApplications(db, userId, limit),

    queryTodayTopPriority: (userId: string, limit: number) =>
      queryTodayTopPriority(db, userId, limit),

    getApplicationHistory: (userId: string, appId: string, take: number) =>
      getApplicationHistory(db, userId, appId, take),

    queryFollowUpsDue: (userId: string, limit: number) =>
      queryFollowUpsDue(db, userId, limit),

    autoMarkGhosting: (userId: string, rows: Array<{ id: string; data: ApplicationDoc }>) =>
      autoMarkGhosting(db, userId, rows, 30),
  };
}

export type { ApplicationDoc, ProcessStatus };
