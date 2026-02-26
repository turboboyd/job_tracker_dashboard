import { BOARD_COLUMNS_LIST, getBoardColumn, type BoardColumnKey } from "src/entities/application/model/status";
import type { LoopMatch } from "src/entities/loopMatch";


export function groupMatchesByStatus(
  matches: readonly LoopMatch[],
): Map<BoardColumnKey, LoopMatch[]> {
  const map = new Map<BoardColumnKey, LoopMatch[]>();

  for (const s of BOARD_COLUMNS_LIST) {
    map.set(s.key, []);
  }

  for (const match of matches) {
    const col = getBoardColumn(match.status);
    (map.get(col) ?? []).push(match);
  }

  return map;
}
