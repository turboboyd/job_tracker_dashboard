import { BOARD_COLUMNS_LIST, type BoardColumnKey } from "src/entities/application/model/status";
import type { LoopMatch } from "src/entities/loopMatch";

import type { BoardVM } from "../../model/types";

export type ColumnsState = Map<BoardColumnKey, LoopMatch[]>;

export function cloneColumns(src: ColumnsState): ColumnsState {
  const m = new Map<BoardColumnKey, LoopMatch[]>();
  for (const [k, v] of src.entries()) m.set(k, [...v]);
  return m;
}

export function buildColumnsFromVm(vm: BoardVM): ColumnsState {
  const m = new Map<BoardColumnKey, LoopMatch[]>();
  for (const c of BOARD_COLUMNS_LIST) {
    m.set(c.key, [...(vm.data.byStatus.get(c.key) ?? [])]);
  }
  return m;
}

export function findContainerOfId(
  state: ColumnsState,
  matchId: string,
): BoardColumnKey | null {
  for (const [status, list] of state.entries()) {
    if (list.some((x) => x.id === matchId)) return status;
  }
  return null;
}

export function removeFromList(
  list: LoopMatch[],
  id: string,
): { next: LoopMatch[]; item: LoopMatch | null } {
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return { next: list, item: null };
  const item = list[idx];
  const next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  return { next, item };
}

export function insertIntoList(
  list: LoopMatch[],
  item: LoopMatch,
  index: number,
): LoopMatch[] {
  const i = Math.max(0, Math.min(index, list.length));
  return [...list.slice(0, i), item, ...list.slice(i)];
}

export function getLaneStatusFromOverId(
  overId: string,
): BoardColumnKey | null {

  if (overId.startsWith("lane:")) return overId.slice(5) as BoardColumnKey;
  if (overId.startsWith("lane-tab:")) return overId.slice(9) as BoardColumnKey;
  return null;
}
