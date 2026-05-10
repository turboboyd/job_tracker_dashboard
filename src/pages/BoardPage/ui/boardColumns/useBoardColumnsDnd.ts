import type {
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
} from "@dnd-kit/core";
import React from "react";

import { getBoardColumn } from "src/entities/application";
import type { LoopMatch } from "src/entities/loopMatch";

import type { BoardVM } from "../../model/types";

import { applyBoardColumnsDragOver } from "./boardColumnsDnd.dragOver";
import {
  findActiveMatchById,
  getActiveLoopName,
  isPendingDropSettled,
  resolveDragStartPayload,
  type PendingDropState,
} from "./boardColumnsDnd.helpers";
import {
  buildColumnsFromVm,
  findContainerOfId,
  type ColumnsState,
} from "./columnsState";
import { useBoardColumnsDndSensors } from "./useBoardColumnsDndSensors";

export type UseBoardColumnsDndResult = Readonly<{
  sensors: ReturnType<typeof useBoardColumnsDndSensors>;
  columnsState: ColumnsState;
  activeId: string | null;
  activeMatch: LoopMatch | null;
  activeLoopName: string;
  handleDragStart: (e: DragStartEvent) => void;
  handleDragOver: (e: DragOverEvent) => void;
  handleDragEnd: (e: DragEndEvent) => Promise<void>;
}>;

export function useBoardColumnsDnd(
  vm: BoardVM,
): UseBoardColumnsDndResult {
  const sensors = useBoardColumnsDndSensors();

  const [columnsState, setColumnsState] = React.useState<ColumnsState>(() =>
    buildColumnsFromVm(vm),
  );
  const [activeId, setActiveId] = React.useState<string | null>(null);


  const pendingDropRef = React.useRef<PendingDropState | null>(null);

  React.useEffect(() => {
    if (activeId) return;

    const pending = pendingDropRef.current;
    if (pending) {
      if (!isPendingDropSettled(pending, vm.data.byStatus)) return;
      pendingDropRef.current = null;
    }

    setColumnsState(buildColumnsFromVm(vm));
  }, [vm.data.byStatus, vm.data.matches, activeId, vm]);

  const activeMatch = React.useMemo(
    () => findActiveMatchById(columnsState, activeId),
    [activeId, columnsState],
  );

  const activeLoopName = React.useMemo(
    () => getActiveLoopName(activeMatch, vm.data.loopIdToName),
    [activeMatch, vm.data.loopIdToName],
  );

  const dragFromRef = React.useRef<ReturnType<typeof resolveDragStartPayload> | null>(null);

  const handleDragStart = React.useCallback(
    (e: DragStartEvent) => {
      const id = String(e.active.id);
      setActiveId(id);

      dragFromRef.current = resolveDragStartPayload(
        columnsState,
        activeMatch,
        id,
        getBoardColumn,
      );
    },
    [columnsState, activeMatch],
  );

  const handleDragOver = React.useCallback((e: DragOverEvent) => {
    setColumnsState((prev) => applyBoardColumnsDragOver(prev, e));
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
