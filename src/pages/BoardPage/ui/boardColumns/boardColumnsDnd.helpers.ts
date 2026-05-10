import type { BoardColumnKey } from "src/entities/application";
import type { LoopMatch } from "src/entities/loopMatch";

import type { BoardDragPayload } from "../../model/types";

import type { ColumnsState } from "./columnsState";
import { findContainerOfId } from "./columnsState";

export interface PendingDropState {
  matchId: string;
  toStatus: BoardColumnKey;
  toIndex: number;
}

export function isMousePointerEvent(event: Event): boolean {
  return (event as PointerEvent).pointerType === "mouse";
}

export function isPendingDropSettled(
  pending: PendingDropState,
  byStatus: ReadonlyMap<BoardColumnKey, readonly LoopMatch[]>,
): boolean {
  const list = byStatus.get(pending.toStatus) ?? [];
  const idx = list.findIndex((item) => item.id === pending.matchId);

  return (
    idx !== -1 &&
    (idx === pending.toIndex ||
      (pending.toIndex >= list.length && idx === list.length - 1))
  );
}

export function findActiveMatchById(
  columnsState: ColumnsState,
  activeId: string | null,
): LoopMatch | null {
  if (!activeId) return null;

  for (const list of columnsState.values()) {
    const found = list.find((item) => item.id === activeId);
    if (found) return found;
  }

  return null;
}

export function getActiveLoopName(
  activeMatch: LoopMatch | null,
  loopIdToName: ReadonlyMap<string, string>,
): string {
  if (!activeMatch) return "";
  return loopIdToName.get(activeMatch.loopId) ?? "";
}

export function resolveDragStartPayload(
  columnsState: ColumnsState,
  activeMatch: LoopMatch | null,
  matchId: string,
  getBoardColumn: (status: LoopMatch["status"]) => BoardColumnKey,
): BoardDragPayload | null {
  const fromStatus: BoardColumnKey | undefined =
    findContainerOfId(columnsState, matchId) ??
    (activeMatch ? getBoardColumn(activeMatch.status) : undefined);

  if (!fromStatus) return null;

  const fromIndex =
    columnsState.get(fromStatus)?.findIndex((item) => item.id === matchId) ??
    -1;

  return {
    matchId,
    fromStatus,
    fromIndex,
  };
}
