import { LOOP_MATCH_STATUSES } from "src/entities/loop";
import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";

import type { BoardOrderByStatus } from "./types";

function storageKey(userId: string) {
  return `board_order_v1:${userId}`;
}

function statusValuesSet(): Set<string> {
  return new Set(LOOP_MATCH_STATUSES.map((s) => String(s.value)));
}

function isValidStatus(value: unknown): value is LoopMatchStatus {
  if (typeof value !== "string") return false;
  return statusValuesSet().has(value);
}

export function createEmptyOrder(): BoardOrderByStatus {
  const obj = {} as BoardOrderByStatus;
  for (const s of LOOP_MATCH_STATUSES) obj[s.value] = [];
  return obj;
}

export function loadOrder(userId: string): BoardOrderByStatus {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return createEmptyOrder();

    const parsed = JSON.parse(raw) as Partial<Record<LoopMatchStatus, unknown>>;

    const base = createEmptyOrder();
    for (const s of LOOP_MATCH_STATUSES) {
      const key = s.value;
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
 * Делает order "железобетонным":
 * 1) гарантирует массивы для всех статусов
 * 2) удаляет id, которых нет в matches
 * 3) добавляет отсутствующие id в правильный статус (невалидный статус -> "new")
 */
export function ensureIdsExist(order: BoardOrderByStatus, matches: readonly LoopMatch[]): void {
  // 1) Ensure all statuses exist
  for (const s of LOOP_MATCH_STATUSES) {
    const key = s.value;
    if (!Array.isArray(order[key])) order[key] = [];
  }

  const existingIds = new Set(matches.map((m) => m.id));

  // 2) Remove ids that no longer exist
  for (const s of LOOP_MATCH_STATUSES) {
    const key = s.value;
    order[key] = (order[key] ?? []).filter((id) => existingIds.has(id));
  }

  // 3) Add missing ids into the correct bucket
  for (const m of matches) {
    const status: LoopMatchStatus = isValidStatus(m.status) ? m.status : "new";
    const arr = order[status] ?? (order[status] = []);
    if (!arr.includes(m.id)) arr.push(m.id);
  }
}

export function moveInArray<T>(arr: readonly T[], from: number, to: number): T[] {
  const copy = [...arr];
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}


export function sortByOrder(
  matches: readonly LoopMatch[],
  orderIds: readonly string[],
): LoopMatch[] {
  const idx = new Map<string, number>();
  for (let i = 0; i < orderIds.length; i++) idx.set(orderIds[i], i);

  const decorated = matches.map((m, i) => ({
    m,
    rank: idx.has(m.id) ? (idx.get(m.id) as number) : Number.MAX_SAFE_INTEGER,
    stable: i,
  }));

  decorated.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.stable - b.stable;
  });

  return decorated.map((x) => x.m);
}
