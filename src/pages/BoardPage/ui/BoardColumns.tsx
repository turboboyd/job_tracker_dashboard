import { DndContext, DragOverlay, closestCorners, useDroppable } from "@dnd-kit/core";
import React from "react";
import { useTranslation } from "react-i18next";

import type { BoardColumnKey } from "src/entities/application";

import type { BoardVM } from "../model/types";

import { BoardColumn } from "./BoardColumn";
import { getBoardColumnColor } from "./boardColumnColors";
import { buildBoardStatuses } from "./boardColumns/boardColumns.helpers";
import { useBoardColumnsDnd } from "./boardColumns/useBoardColumnsDnd";
import { BoardMatchCardOverlay } from "./BoardMatchCard";

function StatusTabTarget({
  status,
  label,
  isActive,
  onClick,
}: {
  status: BoardColumnKey;
  label: string;
  isActive: boolean;
  onClick: () => void;
}) {
  const droppableId = `lane-tab:${status}`;
  const { setNodeRef, isOver } = useDroppable({ id: droppableId });

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onClick}
      className={
        [
          "shrink-0 rounded-full px-md py-sm text-sm",
          "border border-border",
          "transition",
          isActive ? "bg-foreground text-background" : "bg-background text-foreground",
          isOver ? "ring-2 ring-primary/40" : "",
        ].join(" ")
      }
    >
      {label}
    </button>
  );
}

export function BoardColumns({ vm }: { vm: BoardVM }) {
  const { t } = useTranslation();

  const statuses = React.useMemo(() => buildBoardStatuses(t), [t]);

  const [activeStatus, setActiveStatus] = React.useState<BoardColumnKey>(
    (statuses[0]?.status ?? "ACTIVE") as BoardColumnKey,
  );

  const scrollerRef = React.useRef<HTMLDivElement | null>(null);
  const colRefs = React.useRef<Record<string, HTMLDivElement | null>>({});
  const setColRef = React.useCallback(
    (status: BoardColumnKey) => (el: HTMLDivElement | null) => {
      colRefs.current[status] = el;
    },
    [],
  );

  const scrollToStatus = React.useCallback((status: BoardColumnKey) => {
    const el = colRefs.current[status];
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, []);

  const rafRef = React.useRef<number | null>(null);
  const handleScrollerScroll = React.useCallback(() => {
    if (rafRef.current) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      const scroller = scrollerRef.current;
      if (!scroller) return;

      // Find nearest column start relative to current scroll.
      const left = scroller.scrollLeft;
      let bestStatus: BoardColumnKey = activeStatus;
      let bestDist = Number.POSITIVE_INFINITY;
      for (const { status } of statuses) {
        const el = colRefs.current[status];
        if (!el) continue;
        const dist = Math.abs(el.offsetLeft - left);
        if (dist < bestDist) {
          bestDist = dist;
          bestStatus = status;
        }
      }

      if (bestStatus && bestStatus !== activeStatus) setActiveStatus(bestStatus);
    });
  }, [activeStatus, statuses]);

  React.useEffect(() => {
    return () => {
      if (rafRef.current) window.cancelAnimationFrame(rafRef.current);
    };
  }, []);

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
      <div className="h-full min-h-0 flex flex-col overflow-hidden">
        {/* Mobile: status tabs (also act as drop targets while dragging) */}
        <div className="md:hidden shrink-0 px-md pb-sm">
          <div className="flex gap-sm overflow-x-auto no-scrollbar py-sm">
            {statuses.map(({ status, title }) => (
              <StatusTabTarget
                key={status}
                status={status}
                label={title}
                isActive={activeStatus === status}
                onClick={() => {
                  setActiveStatus(status);
                  scrollToStatus(status);
                }}
              />
            ))}
          </div>
        </div>

        {/* Columns scroller */}
        <div
          ref={scrollerRef}
          onScroll={handleScrollerScroll}
          className={
            [
              "flex-1 min-h-0",
              "overflow-x-auto overflow-y-hidden",
              "snap-x snap-mandatory md:snap-none",
            ].join(" ")
          }
        >
          <div className="h-full min-h-0 flex items-stretch gap-3.5 min-w-max px-7 py-[18px]">
            {statuses.map(({ status, title }) => {
              const items = columnsState.get(status) ?? [];
              return (
                <div
                  key={status}
                  ref={setColRef(status)}
                  className="snap-start h-full"
                >
                  <BoardColumn
                    status={status}
                    title={title}
                    color={getBoardColumnColor(status)}
                    items={items}
                    loopIdToName={vm.data.loopIdToName}
                    busy={vm.busy}
                    onArchive={vm.actions.onDelete}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <DragOverlay adjustScale={false}>
        {activeMatch ? (
          <div className="w-[min(90vw,320px)]">
            <BoardMatchCardOverlay
              item={activeMatch}
              loopName={activeLoopName}
              busy={vm.busy}
              onArchive={vm.actions.onDelete}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
