import { BOARD_COLUMNS_LIST, getBoardColumn, type BoardColumnKey } from "src/entities/application";

import { APPLICATION_BOARD_COLUMNS } from "./boardStatusMap";
import type { BoardCardItem, BoardOrderByStatus } from "./types";

function storageKey(userId: string) {
  return `board_order_v1:${userId}`;
}

function statusValuesSet(): Set<string> {
  return new Set(APPLICATION_BOARD_COLUMNS.map((key) => String(key)));
}

function isValidStatus(value: unknown): value is BoardColumnKey {
  if (typeof value !== "string") return false;
  return statusValuesSet().has(value);
}

export function createEmptyOrder(): BoardOrderByStatus {
  const obj = {} as BoardOrderByStatus;
  for (const s of BOARD_COLUMNS_LIST) obj[s.key] = [];
  return obj;
}

export function loadOrder(userId: string): BoardOrderByStatus {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return createEmptyOrder();

    const parsed = JSON.parse(raw) as Partial<Record<BoardColumnKey, unknown>>;

    const base = createEmptyOrder();
    for (const s of BOARD_COLUMNS_LIST) {
      const key = s.key;
      const arr = Array.isArray(parsed?.[key]) ? (parsed?.[key] as unknown[]) : [];
      base[key] = arr.filter((x): x is string => typeof x === "string");
    }
    return base;
  } catch {
    return createEmptyOrder();
  }
}

export function saveOrder(userId: string, order: BoardOrderByStatus): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(order));
  } catch {
    // ignore
  }
}

/**
 * Keeps the persisted order "bulletproof":
 * 1) ensures arrays exist for all columns
 * 2) drops ids that no longer exist among the items
 * 3) adds missing ids into the right column (non-board columns -> "ACTIVE")
 */
export function ensureIdsExist(order: BoardOrderByStatus, items: readonly BoardCardItem[]): void {
  // 1) Ensure all columns exist
  for (const s of BOARD_COLUMNS_LIST) {
    const key = s.key;
    if (!Array.isArray(order[key])) order[key] = [];
  }

  const existingIds = new Set(items.map((item) => item.id));

  // 2) Remove ids that no longer exist
  for (const s of BOARD_COLUMNS_LIST) {
    const key = s.key;
    order[key] = (order[key] ?? []).filter((id) => existingIds.has(id));
  }

  // 3) Add missing ids into the correct bucket
  for (const item of items) {
    const col = getBoardColumn(item.status);
    const status: BoardColumnKey = isValidStatus(col) ? col : "ACTIVE";
    const arr = order[status] ?? (order[status] = []);
    if (!arr.includes(item.id)) arr.push(item.id);
  }
}

export function moveInArray<T>(arr: readonly T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  if (item === undefined) return copy;
  copy.splice(to, 0, item);
  return copy;
}


export function sortByOrder(
  items: readonly BoardCardItem[],
  orderIds: readonly string[],
): BoardCardItem[] {
  const idx = new Map<string, number>();
  for (let i = 0; i < orderIds.length; i++) {
    const id = orderIds[i];
    if (id !== undefined) idx.set(id, i);
  }

  const decorated = items.map((item, i) => ({
    item,
    rank: idx.has(item.id) ? (idx.get(item.id)!) : Number.MAX_SAFE_INTEGER,
    stable: i,
  }));

  decorated.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.stable - b.stable;
  });

  return decorated.map((x) => x.item);
}
