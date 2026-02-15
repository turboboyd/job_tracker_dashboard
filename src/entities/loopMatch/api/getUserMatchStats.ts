import {
  getDocs,
  query,
  type DocumentData,
} from "firebase/firestore";

import { userLoopMatchesCol } from "src/shared/api/firestoreRefs";



export type MatchStats = {
  total: number;
  byStatus: Record<string, number>;
};

function inc(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

export async function getUserMatchStats(uid: string): Promise<MatchStats> {
  // Data lives under: users/{uid}/loopMatches
  const q = query(userLoopMatchesCol(uid));

  const snap = await getDocs(q);

  const byStatus: Record<string, number> = {};
  let total = 0;

  snap.forEach((doc) => {
    const data = doc.data() as DocumentData;

    total += 1;

    // Статусы не фиксируем: берём то, что реально лежит в базе
    const statusRaw = data?.status;
    const status =
      typeof statusRaw === "string" && statusRaw.trim().length > 0
        ? statusRaw.trim()
        : "unknown";

    inc(byStatus, status);
  });

  return { total, byStatus };
}
