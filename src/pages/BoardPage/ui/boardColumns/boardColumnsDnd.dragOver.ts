import type { DragOverEvent } from "@dnd-kit/core";

import type { BoardColumnKey } from "src/entities/application";

import {
  cloneColumns,
  findContainerOfId,
  getLaneStatusFromOverId,
  insertIntoList,
  removeFromList,
  type ColumnsState,
} from "./columnsState";

interface SortableOverData {
  containerId: string;
  index: number;
}

export function applyBoardColumnsDragOver(
  prev: ColumnsState,
  event: DragOverEvent,
): ColumnsState {
  const { active, over } = event;
  if (!over) return prev;

  const activeId = String(active.id);
  const overId = String(over.id);
  const overIndexModifier = getOverIndexModifier(event);
  const overLaneStatus = getLaneStatusFromOverId(overId);
  const overSortable = over.data.current?.sortable as SortableOverData | undefined;

  const next = cloneColumns(prev);
  const fromStatus = findContainerOfId(next, activeId);
  if (!fromStatus) return prev;

  const toStatus =
    (overSortable?.containerId as BoardColumnKey | undefined) ??
    overLaneStatus ??
    findContainerOfId(next, overId);

  if (!toStatus) return prev;

  const fromList = next.get(fromStatus) ?? [];
  const toList = next.get(toStatus) ?? [];
  const overIndexInTo =
    typeof overSortable?.index === "number"
      ? overSortable.index + overIndexModifier
      : toList.length;

  return fromStatus === toStatus
    ? moveWithinColumn(prev, next, fromStatus, fromList, activeId, overIndexInTo)
    : moveAcrossColumns(next, fromStatus, toStatus, fromList, toList, activeId, overIndexInTo);
}

function getOverIndexModifier(event: DragOverEvent): number {
  const { active, over } = event;
  if (!over) return 0;

  const isBelowOverItem =
    !!active.rect.current.translated &&
    active.rect.current.translated.top > over.rect.top + over.rect.height / 2;

  return isBelowOverItem ? 1 : 0;
}

function moveWithinColumn(
  prev: ColumnsState,
  next: ColumnsState,
  status: BoardColumnKey,
  fromList: NonNullable<ReturnType<ColumnsState["get"]>>,
  activeId: string,
  overIndexInTo: number,
): ColumnsState {
  const oldIndex = fromList.findIndex((item) => item.id === activeId);
  if (oldIndex === -1) return prev;

  let newIndex = overIndexInTo;
  if (newIndex > oldIndex) newIndex -= 1;
  if (oldIndex === newIndex) return prev;

  const { next: removed, item } = removeFromList(fromList, activeId);
  if (!item) return prev;

  next.set(status, insertIntoList(removed, item, newIndex));
  return next;
}

function moveAcrossColumns(
  next: ColumnsState,
  fromStatus: BoardColumnKey,
  toStatus: BoardColumnKey,
  fromList: NonNullable<ReturnType<ColumnsState["get"]>>,
  toList: NonNullable<ReturnType<ColumnsState["get"]>>,
  activeId: string,
  overIndexInTo: number,
): ColumnsState {
  const { next: removedFrom, item } = removeFromList(fromList, activeId);
  if (!item) return next;

  next.set(fromStatus, removedFrom);
  next.set(toStatus, insertIntoList(toList, item, overIndexInTo));

  return next;
}
