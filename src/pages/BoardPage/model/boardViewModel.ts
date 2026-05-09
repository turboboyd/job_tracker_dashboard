import { BOARD_COLUMNS_LIST, type BoardColumnKey } from "src/entities/application";
import type { LoopMatch } from "src/entities/loopMatch";

import { groupMatchesByStatus } from "./grouping";
import { sortByOrder } from "./order";

export function buildLoopIdToName(
  loops: readonly { id: string; name: string }[],
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const loop of loops) map.set(loop.id, loop.name);
  return map;
}

export function findMatchById(
  matches: readonly LoopMatch[],
  matchId: string,
): LoopMatch | undefined {
  return matches.find((match) => match.id === matchId);
}

export function buildBoardColumns(
  matches: readonly LoopMatch[],
  orderByStatus: Record<BoardColumnKey, string[]>,
): ReadonlyMap<BoardColumnKey, readonly LoopMatch[]> {
  const grouped = groupMatchesByStatus(matches);

  for (const column of BOARD_COLUMNS_LIST) {
    const status = column.key;
    const list = grouped.get(status) ?? [];
    const ordered = sortByOrder(list, orderByStatus[status] ?? []);
    grouped.set(status, ordered);
  }

  return grouped as ReadonlyMap<BoardColumnKey, readonly LoopMatch[]>;
}
