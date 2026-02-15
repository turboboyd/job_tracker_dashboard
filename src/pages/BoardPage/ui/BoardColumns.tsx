import { DndContext, DragOverlay, closestCorners } from "@dnd-kit/core";
import { useTranslation } from "react-i18next";

import { LOOP_MATCH_STATUSES } from "src/entities/loop";

import type { BoardVM } from "../model/types";

import { BoardColumn } from "./BoardColumn";
import { useBoardColumnsDnd } from "./boardColumns/useBoardColumnsDnd";
import { BoardMatchCardOverlay } from "./BoardMatchCard";

export function BoardColumns({ vm }: { vm: BoardVM }) {
  const { t } = useTranslation();

  const {
    sensors,
    columnsState,
    activeMatch,
    activeLoopName,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  } = useBoardColumnsDnd(vm);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="h-full min-h-0 flex items-stretch gap-md min-w-max">
        {LOOP_MATCH_STATUSES.map((s) => {
          const status = s.value;
          const matches = columnsState.get(status) ?? [];
          return (
            <BoardColumn
              key={status}
              status={status}
              title={t(`board.status.${status}`, s.label)}
              matches={matches}
              loopIdToName={vm.data.loopIdToName}
              busy={vm.busy}
              onDelete={vm.actions.onDelete}
            />
          );
        })}
      </div>

      <DragOverlay adjustScale={false}>
        {activeMatch ? (
          <div className="w-[320px]">
            <BoardMatchCardOverlay
              match={activeMatch}
              loopName={activeLoopName}
              busy={vm.busy}
              onDelete={vm.actions.onDelete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
