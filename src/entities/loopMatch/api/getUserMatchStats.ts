import { getDocs, query } from "firebase/firestore";

import { userApplicationsCol } from "src/shared/api";

export interface MatchStats {
  total: number;
  byStatus: Record<string, number>;
}

const UNKNOWN_STATUS = "unknown";

function inc(map: Record<string, number>, key: string) {
  map[key] = (map[key] ?? 0) + 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readLoopId(data: unknown): string | null {
  if (!isRecord(data) || !isRecord(data.loopLinkage)) return null;
  return readNonEmptyString(data.loopLinkage.loopId);
}

function readProcessStatus(data: unknown): string {
  if (!isRecord(data) || !isRecord(data.process)) return UNKNOWN_STATUS;
  return readNonEmptyString(data.process.status) ?? UNKNOWN_STATUS;
}

export async function getUserMatchStats(uid: string): Promise<MatchStats> {
  const applicationsQuery = query(userApplicationsCol(uid));
  const snapshot = await getDocs(applicationsQuery);

  const byStatus: Record<string, number> = {};
  let total = 0;

  snapshot.forEach((documentSnapshot) => {
    const data: unknown = documentSnapshot.data();

    if (readLoopId(data) === null) return;

    total += 1;
    inc(byStatus, readProcessStatus(data));
  });

  return { total, byStatus };
}
