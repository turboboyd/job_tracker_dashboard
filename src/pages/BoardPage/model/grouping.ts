import { getBoardColumn, type BoardColumnKey } from "src/entities/application";

import { APPLICATION_BOARD_COLUMNS } from "./boardStatusMap";
import type { BoardCardItem } from "./types";

/**
 * Group applications into the board columns by their (normalized) status.
 * Statuses that resolve outside the five rendered columns (e.g. HIRED/ARCHIVED,
 * which active applications cannot hold) fall back to ACTIVE so nothing is lost.
 */
export function groupItemsByStatus(
  items: readonly BoardCardItem[],
): Map<BoardColumnKey, BoardCardItem[]> {
  const map = new Map<BoardColumnKey, BoardCardItem[]>();

  for (const key of APPLICATION_BOARD_COLUMNS) {
    map.set(key, []);
  }

  for (const item of items) {
    const col = getBoardColumn(item.status);
    const bucket = map.get(col) ?? map.get("ACTIVE");
    bucket?.push(item);
  }

  return map;
}
