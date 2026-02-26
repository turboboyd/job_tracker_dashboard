import {
  getDocs,
  query,
  type DocumentData,
} from "firebase/firestore";

import { userApplicationsCol } from "src/shared/api/firestoreRefs";



export type MatchStats = {
  total: number;
  byStatus: Record<string, number>;
};

function inc(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export async function getUserMatchStats(uid: string): Promise<MatchStats> {
  // Unified source: users/{uid}/applications, filtered by loopLinkage.loopId presence
  const q = query(userApplicationsCol(uid));

  const snap = await getDocs(q);

  const byStatus: Record<string, number> = {};
  let total = 0;

  snap.forEach((doc) => {
    const data = doc.data() as DocumentData;

    // count only items that belong to some loop
    const loopId = data?.loopLinkage?.loopId;
    if (typeof loopId !== "string" || loopId.trim().length === 0) return;

    total += 1;

    // Статусы не фиксируем: берём то, что реально лежит в базе
    // Legacy status for UI: derived from applications.process.status
    const statusRaw = data?.process?.status;
    const status =
      typeof statusRaw === "string" && statusRaw.trim().length > 0
        ? statusRaw.trim()
        : "unknown";

    inc(byStatus, status);
  });

  return { total, byStatus };
}
