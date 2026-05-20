import type { Firestore } from 'firebase/firestore';

import { ApiError } from 'src/shared/api/rest/restClient';

import {
  autoMarkGhosting,
  queryFollowUpsDue,
  queryTodayTopPriority,
  subscribeAllActiveApplications,
  subscribeFollowUpsDue,
  subscribePipelineByStatus,
  subscribeTodayTopPriority,
} from './firestore/api';
import type { ApplicationRow } from './firestore/queries.types';
import type { ApplicationsSubscriber, SubscribeError } from './firestore/subscriptions';
import type {
  ApplicationDoc,
  FeedbackType,
  HistoryEventDoc,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
} from './firestore/types';
import {
  changeApplicationStatusViaRest,
  createApplicationCommentViaRest,
  createApplicationViaRest,
  getApplicationByIdViaRest,
  getApplicationHistoryViaRest,
  getCurrentUserViaRest,
  listApplicationsViaRest,
  updateApplicationViaRest,
} from './rest/queries';

export type ApplicationsRepo = ReturnType<typeof createApplicationsRepo>;

export interface AddApplicationCommentInput {
  text: string;
  feedbackType?: FeedbackType;
  sentiment?: Sentiment;
  rejectionReasonCode?: RejectionReasonCode;
}

/**
 * Shared DI-friendly applications repository.
 *
 * Safe usage boundaries:
 * - pages can inject Firestore here without re-wrapping feature API per page
 * - consumers stay db-agnostic and depend on a narrow repo contract
 */
export function createApplicationsRepo(db: Firestore) {
  return {
    ensureUserDoc: async (_userId: string) => {
      await getCurrentUserViaRest();
    },

    createApplication: (
      userId: string,
      payload: Parameters<typeof createApplicationViaRest>[1],
    ) => createApplicationViaRest(userId, payload),

    queryPipelineByStatus: (
      userId: string,
      status: ProcessStatus,
      limit: number,
    ) =>
      listApplicationsViaRest(userId, {
        archived: false,
        status,
        limit,
        offset: 0,
        sort: 'last_status_change_at_desc',
      }).then((result) => result.items),

    queryAllActiveApplications: (userId: string, limit: number) =>
      listApplicationsViaRest(userId, {
        archived: false,
        limit,
        offset: 0,
        sort: 'updated_at_desc',
      }).then((result) => result.items),

    queryTodayTopPriority: (userId: string, limit: number) =>
      queryTodayTopPriority(db, userId, limit),

    getApplication: async (userId: string, appId: string) => {
      try {
        const row = await getApplicationByIdViaRest(userId, appId);
        return row.data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          return null;
        }
        throw error;
      }
    },

    updateApplicationWithHistory: async (
      userId: string,
      appId: string,
      patch: Parameters<typeof updateApplicationViaRest>[2],
      _buildHistory?: (current: ApplicationDoc) => HistoryEventDoc[],
    ) => {
      await updateApplicationViaRest(userId, appId, patch);
    },

    changeStatus: async (
      userId: string,
      appId: string,
      toStatus: ProcessStatus,
    ) => {
      await changeApplicationStatusViaRest(userId, appId, { toStatus });
    },

    addComment: async (
      _userId: string,
      appId: string,
      comment: AddApplicationCommentInput | string,
    ) => {
      await createApplicationCommentViaRest(
        appId,
        typeof comment === 'string' ? { text: comment } : comment,
      );
    },

    getApplicationHistory: (_userId: string, appId: string, take: number) =>
      getApplicationHistoryViaRest(appId, take),

    queryFollowUpsDue: (userId: string, limit: number) =>
      queryFollowUpsDue(db, userId, limit),

    autoMarkGhosting: (userId: string, rows: ApplicationRow[]) =>
      autoMarkGhosting(db, userId, rows, 30),

    subscribeAllActiveApplications: (
      userId: string,
      take: number,
      onUpdate: ApplicationsSubscriber,
      onError?: SubscribeError,
    ) => subscribeAllActiveApplications(db, userId, take, onUpdate, onError),

    subscribePipelineByStatus: (
      userId: string,
      status: ProcessStatus,
      take: number,
      onUpdate: ApplicationsSubscriber,
      onError?: SubscribeError,
    ) => subscribePipelineByStatus(db, userId, status, take, onUpdate, onError),

    subscribeTodayTopPriority: (
      userId: string,
      take: number,
      onUpdate: ApplicationsSubscriber,
      onError?: SubscribeError,
    ) => subscribeTodayTopPriority(db, userId, take, onUpdate, onError),

    subscribeFollowUpsDue: (
      userId: string,
      take: number,
      onUpdate: ApplicationsSubscriber,
      onError?: SubscribeError,
    ) => subscribeFollowUpsDue(db, userId, take, onUpdate, onError),
  };
}

export type { ApplicationDoc, HistoryEventDoc, ProcessStatus };
