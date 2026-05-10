import { useDroppable } from "@dnd-kit/core";
import React from "react";

import type { BoardColumnKey } from "src/entities/application/model/status";
import { classNames } from "src/shared/lib";


type Props = Readonly<{
  status: BoardColumnKey;
  children: React.ReactNode;
}>;

export function BoardLane({ status, children }: Props) {
  const droppableId = `lane:${status}`;

  const { setNodeRef, isOver } = useDroppable({
    id: droppableId,
  });

  return (
    <div
      ref={setNodeRef}
      className={classNames(
        "flex-1 min-h-0",
        // Keep min height so empty columns remain droppable
        "min-h-[180px]",
        "rounded-[7px]",
        "overflow-y-auto overflow-x-hidden",
        isOver && "bg-muted/60 ring-1 ring-primary/30",
      )}
    >
      {children}
    </div>
  );
}
