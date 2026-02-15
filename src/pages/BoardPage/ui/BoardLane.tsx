import { useDroppable } from "@dnd-kit/core";
import React from "react";

import type { LoopMatchStatus } from "src/entities/loopMatch";
import { classNames } from "src/shared/lib";

type Props = Readonly<{
  status: LoopMatchStatus;
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
        "rounded-xl border border-border bg-muted/40",
        "p-md",
        "overflow-y-auto overflow-x-hidden",
        isOver && "bg-muted ring-2 ring-primary/40",
      )}
    >
      {children}
    </div>
  );
}
