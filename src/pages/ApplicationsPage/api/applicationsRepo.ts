import type { Firestore } from "firebase/firestore";

import {
  type ApplicationDoc,
  type ProcessStatus,
  autoMarkGhosting,
  queryFollowUpsDue,
  queryTodayTopPriority,
} from "src/features/applications/firestoreApplications";
import {
  changeApplicationStatusViaRest,
  createApplicationViaRest,
  getApplicationHistoryViaRest,
  getCurrentUserViaRest,
  deleteApplicationViaRest,
  listApplicationsViaRest,
  updateApplicationViaRest,
  type ApplicationListQuery,
} from "src/features/applications/rest/queries";
import { ApiError } from "src/shared/api/rest/restClient";

export type ApplicationsRepo = ReturnType<typeof createApplicationsRepo>;

/**
 * DI-friendly repository for ApplicationsPage.
 * The page (composition layer) injects Firestore; the model/hooks stay db-agnostic.
 */
export function createApplicationsRepo(db: Firestore) {
  return {
    ensureUserDoc: async (_userId: string) => {
      try {
        await getCurrentUserViaRest();
      } catch (error) {
        logRestApplicationsError("Applications REST user bootstrap failed", error);
        throw error;
      }
    },

    createApplication: async (
      userId: string,
      payload: Parameters<typeof createApplicationViaRest>[1]
    ) => {
      try {
        return await createApplicationViaRest(userId, payload);
      } catch (error) {
        logRestApplicationsError("Applications REST create request failed", error);
        throw error;
      }
    },

    queryPipelineByStatus: async (
      userId: string,
      status: ProcessStatus,
      limit: number
    ) => {
      try {
        const result = await listApplicationsViaRest(userId, {
          archived: false,
          status,
          limit,
          offset: 0,
          sort: "last_status_change_at_desc",
        });
        return result.items;
      } catch (error) {
        logRestApplicationsError("Applications REST list request failed", error);
        throw error;
      }
    },

    queryAllActiveApplications: async (userId: string, limit: number) => {
      try {
        const result = await listApplicationsViaRest(userId, {
          archived: false,
          limit,
          offset: 0,
          sort: "updated_at_desc",
        });
        return result.items;
      } catch (error) {
        logRestApplicationsError("Applications REST list request failed", error);
        throw error;
      }
    },

    queryApplicationsPage: async (
      userId: string,
      query: ApplicationListQuery,
    ) => {
      try {
        return await listApplicationsViaRest(userId, query);
      } catch (error) {
        logRestApplicationsError("Applications REST paginated list request failed", error);
        throw error;
      }
    },

    setFavorite: async (userId: string, appId: string, isFavorite: boolean) => {
      try {
        return await updateApplicationViaRest(userId, appId, { isFavorite });
      } catch (error) {
        logRestApplicationsError("Applications REST favorite request failed", error);
        throw error;
      }
    },

    archiveApplication: async (_userId: string, appId: string) => {
      try {
        await deleteApplicationViaRest(appId);
      } catch (error) {
        logRestApplicationsError("Applications REST archive request failed", error);
        throw error;
      }
    },

    restoreApplication: async (userId: string, appId: string) => {
      try {
        return await updateApplicationViaRest(userId, appId, { archived: false });
      } catch (error) {
        logRestApplicationsError("Applications REST restore request failed", error);
        throw error;
      }
    },

    queryTodayTopPriority: (userId: string, limit: number) =>
      queryTodayTopPriority(db, userId, limit),

    getApplicationHistory: async (_userId: string, appId: string, take: number) => {
      try {
        return await getApplicationHistoryViaRest(appId, take);
      } catch (error) {
        logRestApplicationsError("Applications REST history request failed", error);
        throw error;
      }
    },

    queryFollowUpsDue: (userId: string, limit: number) =>
      queryFollowUpsDue(db, userId, limit),

    autoMarkGhosting: (userId: string, rows: Array<{ id: string; data: ApplicationDoc }>) =>
      autoMarkGhosting(db, userId, rows, 30),

    changeStatus: async (userId: string, appId: string, status: ProcessStatus) => {
      try {
        return await changeApplicationStatusViaRest(userId, appId, {
          toStatus: status,
          subStatus: null,
          comment: null,
          correlationId: null,
        });
      } catch (error) {
        logRestApplicationsError("Applications REST status request failed", error);
        throw error;
      }
    },
  };
}

export type { ApplicationDoc, ProcessStatus };

function logRestApplicationsError(message: string, error: unknown): void {
  if (error instanceof ApiError) {
    // Preserve backend request_id / X-Request-ID for debugging without changing UI behavior.
    console.error(message, {
      requestId: error.requestId,
      status: error.status,
      code: error.code,
    });
  }
}
