import type { Firestore } from "firebase/firestore";
import {
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { ProcessStatus } from "./domain.types";
import { mapApplicationRow } from "./queries.helpers";
import type { ApplicationRow } from "./queries.types";
import { applicationsColRef } from "./refs";

/**
 * Real-time subscriptions for the applications list.
 *
 * Mirror the one-shot `query*` helpers in `queries.ts` 1:1, but stream
 * updates via Firestore listeners. Returns an unsubscribe function.
 *
 * Existing one-shot helpers stay in place — nothing else in the codebase
 * needs to change.
 */

export type ApplicationsSubscriber = (rows: ApplicationRow[]) => void;
export type SubscribeError = (error: Error) => void;

export function subscribeAllActiveApplications(
  db: Firestore,
  userId: string,
  take: number,
  onUpdate: ApplicationsSubscriber,
  onError?: SubscribeError,
): () => void {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    limit(take),
  );

  return onSnapshot(
    applicationsQuery,
    (snap) => onUpdate(snap.docs.map(mapApplicationRow)),
    (error) => onError?.(error),
  );
}

export function subscribePipelineByStatus(
  db: Firestore,
  userId: string,
  status: ProcessStatus,
  take: number,
  onUpdate: ApplicationsSubscriber,
  onError?: SubscribeError,
): () => void {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    where("process.status", "==", status),
    orderBy("process.lastStatusChangeAt", "desc"),
    limit(take),
  );

  return onSnapshot(
    applicationsQuery,
    (snap) => onUpdate(snap.docs.map(mapApplicationRow)),
    (error) => onError?.(error),
  );
}

export function subscribeTodayTopPriority(
  db: Firestore,
  userId: string,
  take: number,
  onUpdate: ApplicationsSubscriber,
  onError?: SubscribeError,
): () => void {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    orderBy("priority.score", "desc"),
    limit(take),
  );

  return onSnapshot(
    applicationsQuery,
    (snap) => onUpdate(snap.docs.map(mapApplicationRow)),
    (error) => onError?.(error),
  );
}

export function subscribeFollowUpsDue(
  db: Firestore,
  userId: string,
  take: number,
  onUpdate: ApplicationsSubscriber,
  onError?: SubscribeError,
): () => void {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    where("process.needsFollowUp", "==", true),
    orderBy("process.followUpDueAt", "asc"),
    limit(take),
  );

  return onSnapshot(
    applicationsQuery,
    (snap) => onUpdate(snap.docs.map(mapApplicationRow)),
    (error) => onError?.(error),
  );
}
