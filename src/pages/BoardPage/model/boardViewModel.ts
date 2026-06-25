import type { BoardColumnKey } from "src/entities/application";

import { APPLICATION_BOARD_COLUMNS } from "./boardStatusMap";
import { groupItemsByStatus } from "./grouping";
import { sortByOrder } from "./order";
import type { BoardCardItem, BoardOrderByStatus } from "./types";

export function buildLoopIdToName(
  loops: readonly { id: string; name: string }[],
): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const loop of loops) map.set(loop.id, loop.name);
  return map;
}

export function buildBoardColumns(
  items: readonly BoardCardItem[],
  orderByStatus: Record<BoardColumnKey, string[]>,
): ReadonlyMap<BoardColumnKey, readonly BoardCardItem[]> {
  const grouped = groupItemsByStatus(items);

  for (const status of APPLICATION_BOARD_COLUMNS) {
    const list = grouped.get(status) ?? [];
    const ordered = sortByOrder(list, (orderByStatus as BoardOrderByStatus)[status] ?? []);
    grouped.set(status, ordered);
  }

  return grouped as ReadonlyMap<BoardColumnKey, readonly BoardCardItem[]>;
}
