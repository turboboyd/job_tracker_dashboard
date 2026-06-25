import { type BoardColumnKey } from "src/entities/application";

import { APPLICATION_BOARD_COLUMNS } from "../../model/boardStatusMap";
import type { BoardCardItem, BoardVM } from "../../model/types";

export type ColumnsState = Map<BoardColumnKey, BoardCardItem[]>;

export function cloneColumns(src: ColumnsState): ColumnsState {
  const m = new Map<BoardColumnKey, BoardCardItem[]>();
  for (const [k, v] of src.entries()) m.set(k, [...v]);
  return m;
}

export function buildColumnsFromVm(vm: BoardVM): ColumnsState {
  const m = new Map<BoardColumnKey, BoardCardItem[]>();
  for (const key of APPLICATION_BOARD_COLUMNS) {
    m.set(key, [...(vm.data.byStatus.get(key) ?? [])]);
  }
  return m;
}

export function findContainerOfId(
  state: ColumnsState,
  itemId: string,
): BoardColumnKey | null {
  for (const [status, list] of state.entries()) {
    if (list.some((x) => x.id === itemId)) return status;
  }
  return null;
}

export function removeFromList(
  list: BoardCardItem[],
  id: string,
): { next: BoardCardItem[]; item: BoardCardItem | null } {
  const idx = list.findIndex((x) => x.id === id);
  if (idx === -1) return { next: list, item: null };
  const item = list[idx] ?? null;
  const next = [...list.slice(0, idx), ...list.slice(idx + 1)];
  return { next, item };
}

export function insertIntoList(
  list: BoardCardItem[],
  item: BoardCardItem,
  index: number,
): BoardCardItem[] {
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
