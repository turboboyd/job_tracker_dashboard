import {
  getCountFromServer,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";

import { userLoopDoc, userLoopsCol } from "src/shared/api/firestoreRefs";

import type { Loop } from "../../../model";
import { mapLoopDoc } from "../../mappers/loopApi.mappers";
import { snapToPage } from "../../utils/firestorePaging";

export type LoopsPageResponse = {
  items: Loop[];
  total: number;
  nextCursor: string | null;
};

export type GetLoopsPageInput = {
  pageSize: number;
  cursorId?: string | null;
};

async function getLoopsTotal(userId: string): Promise<number> {
  const colRef = userLoopsCol(userId);
  const countQ = query(colRef);
  const countSnap = await getCountFromServer(countQ);
  return countSnap.data().count ?? 0;
}

function buildBasePageQuery(userId: string, pageSize: number) {
  const colRef = userLoopsCol(userId);
  return query(
    colRef,
    orderBy("createdAtTs", "desc"),
    limit(pageSize)
  );
}

function buildPageAfterQuery(
  userId: string,
  pageSize: number,
  cursorSnap: Awaited<ReturnType<typeof getDoc>>
) {
  const colRef = userLoopsCol(userId);
  return query(
    colRef,
    orderBy("createdAtTs", "desc"),
    startAfter(cursorSnap),
    limit(pageSize)
  );
}

async function getCursorSnapOrNull(userId: string, cursorId?: string | null) {
  if (!cursorId) return null;
  const snap = await getDoc(userLoopDoc(userId, cursorId));
  return snap.exists() ? snap : null;
}

export async function getLoopsPageQuery(
  userId: string,
  input: GetLoopsPageInput
): Promise<LoopsPageResponse> {
  const { pageSize, cursorId } = input;

  const [total, cursorSnap] = await Promise.all([
    getLoopsTotal(userId),
    getCursorSnapOrNull(userId, cursorId),
  ]);


  if (!cursorSnap) {
    const snap = await getDocs(buildBasePageQuery(userId, pageSize));
    const page = snapToPage(snap, mapLoopDoc);
    return { ...page, total };
  }

  const snap = await getDocs(buildPageAfterQuery(userId, pageSize, cursorSnap));
  const page = snapToPage(snap, mapLoopDoc);
  return { ...page, total };
}
