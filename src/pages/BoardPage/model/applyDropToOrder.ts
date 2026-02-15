import type { LoopMatchStatus } from "src/entities/loopMatch";

import type { BoardDragPayload, BoardOrderByStatus } from "./types";

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}


export function applyDropToOrder(
  prev: BoardOrderByStatus,
  payload: BoardDragPayload,
  toStatus: LoopMatchStatus,
  toIndex: number,
): BoardOrderByStatus {
  const next: BoardOrderByStatus = { ...prev };

  const fromList = [...(next[payload.fromStatus] ?? [])];
  const toList = payload.fromStatus === toStatus ? fromList : [...(next[toStatus] ?? [])];


  const fromIndex = fromList.indexOf(payload.matchId);
  if (fromIndex !== -1) {
    fromList.splice(fromIndex, 1);
  }


  const safeIndex = clamp(toIndex, 0, toList.length);
  toList.splice(safeIndex, 0, payload.matchId);


  if (payload.fromStatus === toStatus) {
    next[toStatus] = toList;
  } else {
    next[payload.fromStatus] = fromList;
    next[toStatus] = toList;
  }

  return next;
}
