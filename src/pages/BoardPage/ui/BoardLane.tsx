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
        // Important: when a lane is empty, the content height may collapse and the drop-zone becomes
        // too small to hit. Keep a reasonable minimum height so dropping into empty columns works.
        "min-h-[180px]",
        "rounded-xl border border-border bg-muted/40",
        "p-sm md:p-md",
        "overflow-y-auto overflow-x-hidden",
        isOver && "bg-muted ring-2 ring-primary/40",
      )}
    >
      {children}
    </div>
  );
}
