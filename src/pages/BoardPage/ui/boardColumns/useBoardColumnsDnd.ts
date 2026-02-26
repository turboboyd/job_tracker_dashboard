import {
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import React from "react";

import { getBoardColumn, type BoardColumnKey } from "src/entities/application/model/status";
import type { LoopMatch } from "src/entities/loopMatch";

import type { BoardDragPayload, BoardVM } from "../../model/types";

import {
  buildColumnsFromVm,
  cloneColumns,
  findContainerOfId,
  getLaneStatusFromOverId,
  insertIntoList,
  removeFromList,
  type ColumnsState,
} from "./columnsState";

export type UseBoardColumnsDndResult = Readonly<{
  sensors: ReturnType<typeof useSensors>;
  columnsState: ColumnsState;
  activeId: string | null;
  activeMatch: LoopMatch | null;
  activeLoopName: string;
  handleDragStart: (e: DragStartEvent) => void;
  handleDragOver: (e: DragOverEvent) => void;
  handleDragEnd: (e: DragEndEvent) => Promise<void>;
}>;

export function useBoardColumnsDnd(vm: BoardVM): UseBoardColumnsDndResult {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
    // Mobile: allow normal scrolling; start drag only after a short long-press.
    useSensor(TouchSensor, {
      activationConstraint: { delay: 220, tolerance: 6 },
    }),
  );

  const [columnsState, setColumnsState] = React.useState<ColumnsState>(() =>
    buildColumnsFromVm(vm),
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);


  const pendingDropRef = React.useRef<
    | {
        matchId: string;
        toStatus: BoardColumnKey;
        toIndex: number;
      }
    | null
  >(null);

  React.useEffect(() => {
    if (activeId) return;

    const pending = pendingDropRef.current;
    if (pending) {
      const list = vm.data.byStatus.get(pending.toStatus) ?? [];
      const idx = list.findIndex((x) => x.id === pending.matchId);

      const isAtTargetIndex =
        idx === pending.toIndex ||
        (pending.toIndex >= list.length && idx === list.length - 1);

      if (idx === -1 || !isAtTargetIndex) return;
      pendingDropRef.current = null;
    }

    setColumnsState(buildColumnsFromVm(vm));
  }, [vm.data.byStatus, vm.data.matches, activeId, vm]);

  const activeMatch = React.useMemo(() => {
    if (!activeId) return null;
    for (const list of columnsState.values()) {
      const found = list.find((m) => m.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeId, columnsState]);

  const activeLoopName = React.useMemo(() => {
    if (!activeMatch) return "";
    return vm.data.loopIdToName.get(activeMatch.loopId) ?? "";
  }, [activeMatch, vm.data.loopIdToName]);

  const dragFromRef = React.useRef<BoardDragPayload | null>(null);

  const handleDragStart = React.useCallback(
    (e: DragStartEvent) => {
      const id = String(e.active.id);
      setActiveId(id);

      const fromStatus: BoardColumnKey | undefined =
        (findContainerOfId(columnsState, id) as BoardColumnKey | null) ??
        (activeMatch ? getBoardColumn(activeMatch.status) : undefined);
      const fromIndex = fromStatus
        ? columnsState.get(fromStatus)?.findIndex((x) => x.id === id) ?? 0
        : 0;

      if (fromStatus) {
        dragFromRef.current = { matchId: id, fromStatus, fromIndex };
      } else {
        dragFromRef.current = null;
      }
    },
    [columnsState, activeMatch],
  );

  const handleDragOver = React.useCallback((e: DragOverEvent) => {
    const { active, over } = e;
    if (!over) return;

    const activeIdStr = String(active.id);
    const overIdStr = String(over.id);

    const isBelowOverItem =
      !!active.rect.current.translated &&
      active.rect.current.translated.top > over.rect.top + over.rect.height / 2;
    const overIndexModifier = isBelowOverItem ? 1 : 0;

    setColumnsState((prev) => {
      const next = cloneColumns(prev);

      const fromStatus = findContainerOfId(next, activeIdStr);
      if (!fromStatus) return prev;

      const overLaneStatus = getLaneStatusFromOverId(overIdStr);
      const overSortable = over.data.current?.sortable as
        | { containerId: string; index: number }
        | undefined;

      const toStatus =
        (overSortable?.containerId as BoardColumnKey | undefined) ??
        (overLaneStatus ??
          (findContainerOfId(next, overIdStr) as BoardColumnKey | null));

      if (!toStatus) return prev;

      const fromList = next.get(fromStatus) ?? [];
      const toList = next.get(toStatus) ?? [];

      const overIndexInTo =
        typeof overSortable?.index === "number"
          ? overSortable.index + overIndexModifier
          : toList.length;

      if (fromStatus === toStatus) {
        const oldIndex = fromList.findIndex((x) => x.id === activeIdStr);
        if (oldIndex === -1) return prev;

        let newIndex = overIndexInTo;
        if (newIndex > oldIndex) newIndex -= 1;

        if (oldIndex === newIndex) return prev;

        const { next: removed, item } = removeFromList(fromList, activeIdStr);
        if (!item) return prev;

        next.set(fromStatus, insertIntoList(removed, item, newIndex));
        return next;
      }

      const { next: removedFrom, item } = removeFromList(fromList, activeIdStr);
      if (!item) return prev;

      next.set(fromStatus, removedFrom);
      next.set(toStatus, insertIntoList(toList, item, overIndexInTo));
      return next;
    });
  }, []);

  const handleDragEnd = React.useCallback(
    async (e: DragEndEvent) => {
      const { active, over } = e;

      const from = dragFromRef.current;
      dragFromRef.current = null;
      setActiveId(null);

      if (!from) return;
      if (!over) {
        setColumnsState(buildColumnsFromVm(vm));
        return;
      }

      const activeIdStr = String(active.id);

      const toStatus = findContainerOfId(columnsState, activeIdStr);
      if (!toStatus) {
        setColumnsState(buildColumnsFromVm(vm));
        return;
      }

      const toList = columnsState.get(toStatus) ?? [];
      const toIndex = toList.findIndex((x) => x.id === activeIdStr);

      pendingDropRef.current = {
        matchId: activeIdStr,
        toStatus,
        toIndex: Math.max(0, toIndex),
      };

      try {
        await vm.actions.onDropToStatus(
          {
            matchId: activeIdStr,
            fromStatus: from.fromStatus,
            fromIndex: from.fromIndex,
          },
          toStatus,
          Math.max(0, toIndex),
        );
      } catch {
        pendingDropRef.current = null;
        setColumnsState(buildColumnsFromVm(vm));
      }
    },
    [columnsState, vm],
  );

  return {
    sensors,
    columnsState,
    activeId,
    activeMatch,
    activeLoopName,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
