import { getBoardColumn } from "src/entities/application";

import { normalizeAppStatus } from "../model/dashboardTimeSeries";

export interface DashboardTopLoop {
  id: string;
  name: string;
}

export interface DashboardTopLoopMatch {
  loopId?: string;
  status?: unknown;
}

export interface DashboardTopLoopRow {
  interview: number;
  loopId: string;
  name: string;
  offer: number;
  total: number;
}

const TOP_LOOPS_LIMIT = 5;

export function buildDashboardTopLoopRows(
  loops: DashboardTopLoop[],
  matches: DashboardTopLoopMatch[],
): DashboardTopLoopRow[] {
  const rowsByLoopId = createRowsByLoopId(loops);

  for (const match of matches) {
    addMatchToLoopRow(rowsByLoopId, match);
  }

  return [...rowsByLoopId.values()]
    .filter((row) => row.total > 0)
    .sort(compareTopLoopRows)
    .slice(0, TOP_LOOPS_LIMIT);
}

function createRowsByLoopId(loops: DashboardTopLoop[]): Map<string, DashboardTopLoopRow> {
  return new Map(
    loops.map((loop) => [
      loop.id,
      {
        interview: 0,
        loopId: loop.id,
        name: loop.name,
        offer: 0,
        total: 0,
      },
    ]),
  );
}

function addMatchToLoopRow(
  rowsByLoopId: Map<string, DashboardTopLoopRow>,
  match: DashboardTopLoopMatch,
): void {
  if (!match.loopId) return;

  const row = rowsByLoopId.get(match.loopId);
  if (!row) return;

  incrementTopLoopRow(row, match.status);
}

function incrementTopLoopRow(row: DashboardTopLoopRow, status: unknown): void {
  const column = getBoardColumn(normalizeAppStatus(status));

  if (column === "INTERVIEW") row.interview += 1;
  if (column === "OFFER") row.offer += 1;
  if (column !== "ARCHIVED") row.total += 1;
}

function compareTopLoopRows(left: DashboardTopLoopRow, right: DashboardTopLoopRow): number {
  return right.interview - left.interview || right.offer - left.offer || right.total - left.total;
}
