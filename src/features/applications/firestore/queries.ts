import type { Firestore } from "firebase/firestore";
import {
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";

import type { ApplicationDoc } from "./documents.types";
import type { ProcessStatus } from "./domain.types";
import {
  mapApplicationRow,
  mapHistoryRow,
} from "./queries.helpers";
import type { ApplicationHistoryRow, ApplicationRow } from "./queries.types";
import { applicationDocRef, applicationsColRef, historyColRef } from "./refs";

/**
 * Fetch one application by id.
 */
export async function getApplication(
  db: Firestore,
  userId: string,
  appId: string,
): Promise<ApplicationDoc | null> {
  const snapshot = await getDoc(applicationDocRef(db, userId, appId));
  return snapshot.exists() ? (snapshot.data() as ApplicationDoc) : null;
}

/**
 * Load latest history (descending).
 */
export async function getApplicationHistory(
  db: Firestore,
  userId: string,
  appId: string,
  take = 50,
): Promise<ApplicationHistoryRow[]> {
  const historyQuery = query(
    historyColRef(db, userId, appId),
    orderBy("createdAt", "desc"),
    limit(take),
  );
  const snapshot = await getDocs(historyQuery);

  return snapshot.docs.map(mapHistoryRow);
}

/**
 * Queries (Pipeline / Today / Follow-ups).
 */
export async function queryPipelineByStatus(
  db: Firestore,
  userId: string,
  status: ProcessStatus,
  take = 50,
): Promise<ApplicationRow[]> {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    where("process.status", "==", status),
    orderBy("process.lastStatusChangeAt", "desc"),
    limit(take),
  );
  const snapshot = await getDocs(applicationsQuery);

  return snapshot.docs.map(mapApplicationRow);
}

export async function queryTodayTopPriority(
  db: Firestore,
  userId: string,
  take = 20,
): Promise<ApplicationRow[]> {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    orderBy("priority.score", "desc"),
    limit(take),
  );
  const snapshot = await getDocs(applicationsQuery);

  return snapshot.docs.map(mapApplicationRow);
}

export async function queryFollowUpsDue(
  db: Firestore,
  userId: string,
  take = 50,
): Promise<ApplicationRow[]> {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    where("process.needsFollowUp", "==", true),
    orderBy("process.followUpDueAt", "asc"),
    limit(take),
  );
  const snapshot = await getDocs(applicationsQuery);

  return snapshot.docs.map(mapApplicationRow);
}

/**
 * Fetch all active (not archived) applications.
 *
 * NOTE:
 * - Intentionally does NOT use orderBy to avoid requiring additional composite indexes.
 * - Sort client-side if you need recency.
 */
export async function queryAllActiveApplications(
  db: Firestore,
  userId: string,
  take = 500,
): Promise<ApplicationRow[]> {
  const applicationsQuery = query(
    applicationsColRef(db, userId),
    where("archived", "==", false),
    limit(take),
  );
  const snapshot = await getDocs(applicationsQuery);

  return snapshot.docs.map(mapApplicationRow);
}
