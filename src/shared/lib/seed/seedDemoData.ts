import {
  Timestamp,
  doc,
  getDoc,
  writeBatch,
  type Firestore,
} from "firebase/firestore";

import {
  buildDemoAppBackfill,
  buildDemoApplication,
  demoAppId,
  makeItems,
  makeLoop,
  needsDemoAppBackfill,
} from "./seedDemoData.builders";
import {
  APPLICATIONS_COLLECTION,
  DEMO_LOOP_ID,
  LOOPS_COLLECTION,
  USERS_COLLECTION,
} from "./seedDemoData.constants";
import type {
  DemoAppAuditResult,
  DemoItem,
  DemoSeedEntry,
} from "./seedDemoData.types";

function isoNow(): string {
  return new Date().toISOString();
}

function userLoopRef(db: Firestore, uid: string, loopId: string) {
  return doc(db, USERS_COLLECTION, uid, LOOPS_COLLECTION, loopId);
}

function userApplicationRef(db: Firestore, uid: string, appId: string) {
  return doc(db, USERS_COLLECTION, uid, APPLICATIONS_COLLECTION, appId);
}

async function auditDemoApplications(params: {
  db: Firestore;
  items: DemoItem[];
  uid: string;
}): Promise<DemoAppAuditResult> {
  const { db, items, uid } = params;
  const missing: DemoSeedEntry[] = [];
  const backfill: DemoSeedEntry[] = [];

  for (const [index, item] of items.entries()) {
    const entry: DemoSeedEntry = {
      appId: demoAppId(index),
      item,
    };
    const snapshot = await getDoc(userApplicationRef(db, uid, entry.appId));

    if (!snapshot.exists()) {
      missing.push(entry);
      continue;
    }

    if (needsDemoAppBackfill(snapshot.data())) {
      backfill.push(entry);
    }
  }

  return { backfill, missing };
}

async function commitDemoAppBackfills(params: {
  backfill: DemoSeedEntry[];
  db: Firestore;
  uid: string;
}): Promise<void> {
  const { backfill, db, uid } = params;

  if (backfill.length === 0) return;

  const batch = writeBatch(db);

  for (const entry of backfill) {
    batch.set(
      userApplicationRef(db, uid, entry.appId),
      buildDemoAppBackfill(entry.item),
      { merge: true },
    );
  }

  await batch.commit();
}

async function commitMissingDemoData(params: {
  db: Firestore;
  loopExists: boolean;
  missing: DemoSeedEntry[];
  nowIso: string;
  nowTs: Timestamp;
  uid: string;
}): Promise<void> {
  const { db, loopExists, missing, nowIso, nowTs, uid } = params;

  if (loopExists && missing.length === 0) return;

  const batch = writeBatch(db);

  if (!loopExists) {
    batch.set(
      userLoopRef(db, uid, DEMO_LOOP_ID),
      makeLoop(nowIso, nowTs),
      { merge: false },
    );
  }

  for (const entry of missing) {
    batch.set(
      userApplicationRef(db, uid, entry.appId),
      buildDemoApplication(entry.item, uid, nowTs),
      { merge: false },
    );
  }

  await batch.commit();
}

/**
 * Idempotently ensures the demo loop and demo applications exist for a user.
 *
 * This keeps first-login data repair in one place:
 * - create users/{uid}/loops/demoLoop when it is missing
 * - create users/{uid}/applications/demoApp_01..20 when missing
 * - backfill loop linkage on older demo applications
 */
export async function seedDemoDataIfNeeded(params: {
  db: Firestore;
  uid: string;
}): Promise<void> {
  const { db, uid } = params;
  const nowIso = isoNow();
  const nowTs = Timestamp.now();
  const items = makeItems(DEMO_LOOP_ID);

  const loopSnapshot = await getDoc(userLoopRef(db, uid, DEMO_LOOP_ID));
  const auditResult = await auditDemoApplications({ db, items, uid });

  await commitDemoAppBackfills({
    backfill: auditResult.backfill,
    db,
    uid,
  });

  await commitMissingDemoData({
    db,
    loopExists: loopSnapshot.exists(),
    missing: auditResult.missing,
    nowIso,
    nowTs,
    uid,
  });
}
