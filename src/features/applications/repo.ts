import type { Firestore } from 'firebase/firestore';

import {
  addComment,
  autoMarkGhosting,
  changeStatus,
  createApplication,
  ensureUserDoc,
  getApplication,
  getApplicationHistory,
  queryAllActiveApplications,
  queryFollowUpsDue,
  queryPipelineByStatus,
  queryTodayTopPriority,
  subscribeAllActiveApplications,
  subscribeFollowUpsDue,
  subscribePipelineByStatus,
  subscribeTodayTopPriority,
  updateApplicationWithHistory,
} from './firestore/api';
import type { ApplicationsSubscriber, SubscribeError } from './firestore/subscriptions';
import type { ApplicationRow } from './firestore/queries.types';
import type {
  ApplicationDoc,
  FeedbackType,
  HistoryEventDoc,
  ProcessStatus,
  RejectionReasonCode,
  Sentiment,
} from './firestore/types';

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
    ensureUserDoc: (userId: string) => ensureUserDoc(db, userId),

    createApplication: (
      userId: string,
      payload: Parameters<typeof createApplication>[2],
    ) => createApplication(db, userId, payload),

    queryPipelineByStatus: (
      userId: string,
      status: ProcessStatus,
      limit: number,
    ) => queryPipelineByStatus(db, userId, status, limit),

    queryAllActiveApplications: (userId: string, limit: number) =>
      queryAllActiveApplications(db, userId, limit),

    queryTodayTopPriority: (userId: string, limit: number) =>
      queryTodayTopPriority(db, userId, limit),

    getApplication: (userId: string, appId: string) =>
      getApplication(db, userId, appId),

    updateApplicationWithHistory: (
      userId: string,
      appId: string,
      patch: Parameters<typeof updateApplicationWithHistory>[3],
      buildHistory?: Parameters<typeof updateApplicationWithHistory>[4],
    ) => updateApplicationWithHistory(db, userId, appId, patch, buildHistory ?? (() => [])),

    changeStatus: (
      userId: string,
      appId: string,
      toStatus: ProcessStatus,
    ) => changeStatus(db, userId, appId, toStatus),

    addComment: (
      userId: string,
      appId: string,
      comment: AddApplicationCommentInput | string,
    ) => addComment(db, userId, appId, typeof comment === 'string' ? { text: comment } : comment),

    getApplicationHistory: (userId: string, appId: string, take: number) =>
      getApplicationHistory(db, userId, appId, take),

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
