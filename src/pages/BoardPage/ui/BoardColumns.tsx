import {
  DndContext,
  MeasuringStrategy,
  pointerWithin,
  rectIntersection,
  closestCenter,
  type DragMoveEvent,
  type CollisionDetection,
} from '@dnd-kit/core';
import { restrictToWindowEdges } from '@dnd-kit/modifiers';
import React from 'react';
import { useTranslation } from 'react-i18next';

import type { BoardVM } from '../model/types';

import { buildBoardStatuses } from './boardColumns/boardColumns.helpers';
import {
  BoardColumnsOverlay,
  BoardColumnsScroller,
} from './boardColumns/boardColumns.sections';
import { restrictToBoardScrollContainer } from './boardColumns/restrictToBoardScrollContainer';
import { useBoardColumnsDnd } from './boardColumns/useBoardColumnsDnd';
import { useDragScrollLock } from './boardColumns/useDragScrollLock';
import { useTrelloEdgeAutoScroll } from './boardColumns/useTrelloEdgeAutoScroll';

export function BoardColumns({ vm }: { vm: BoardVM }) {
  const { t } = useTranslation();

  const statuses = React.useMemo(() => buildBoardStatuses(t), [t]);

  const {
    sensors,
    columnsState,
    activeId,
    activeMatch,
    activeLoopName,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardColumnsDnd(vm);

  useDragScrollLock(!!activeId);

  const [boardScrollEl, setBoardScrollEl] = React.useState<HTMLDivElement | null>(null);
  const boardScrollRef = React.useCallback((node: HTMLDivElement | null) => {
    setBoardScrollEl(node);
  }, []);

  const { setClientPoint } = useTrelloEdgeAutoScroll({
    boardScrollEl,
    enabled: !!activeId,
  });

  const handleDragMove = React.useCallback(
    (event: DragMoveEvent) => {
      const translatedRect = event.active.rect.current.translated;
      if (!translatedRect) return;

      setClientPoint({
        x: translatedRect.left + translatedRect.width / 2,
        y: translatedRect.top + translatedRect.height / 2,
      });
    },
    [setClientPoint],
  );

  const collisionDetection: CollisionDetection = React.useCallback((args) => {
    const pointer = pointerWithin(args);
    if (pointer.length > 0) return pointer;

    const intersections = rectIntersection(args);
    if (intersections.length > 0) return intersections;

    return closestCenter(args);
  }, []);

  const modifiers = React.useMemo(
    () => [
      restrictToWindowEdges,
      ...(boardScrollEl ? [restrictToBoardScrollContainer(boardScrollEl)] : []),
    ],
    [boardScrollEl],
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      measuring={{
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      }}
      autoScroll={false}
      modifiers={modifiers}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <BoardColumnsScroller
        activeId={activeId}
        boardScrollRef={boardScrollRef}
        statuses={statuses}
        columnsState={columnsState}
        loopIdToName={vm.data.loopIdToName}
        busy={vm.busy}
        onDelete={vm.actions.onDelete}
      />

      <BoardColumnsOverlay
        activeMatch={activeMatch}
        activeLoopName={activeLoopName}
        busy={vm.busy}
        onDelete={vm.actions.onDelete}
      />
    </DndContext>
  );
}
