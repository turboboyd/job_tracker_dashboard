import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

import type { LoopMatch } from "src/entities/loopMatch";
import { classNames } from "src/shared/lib";

import { BoardMatchCardView } from "./BoardMatchCardView";

type Props = Readonly<{
  match: LoopMatch;
  loopName: string;
  busy: boolean;
  onDelete: (matchId: LoopMatch["id"]) => void | Promise<void>;
  index: number;
  overlay?: boolean;
}>;

export function BoardMatchCard({ match, loopName, busy, onDelete, index }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: match.id,
      disabled: busy,
      data: {
        matchId: match.id,
        status: match.status,
        index,
      },
    });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.25 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={classNames("touch-none select-none", isDragging && "z-10")}
      {...attributes}
      {...listeners}
    >
      <BoardMatchCardView
        match={match}
        loopName={loopName}
        busy={busy}
        onDelete={onDelete}
        overlay={false}
      />
    </div>
  );
}


export function BoardMatchCardOverlay({
  match,
  loopName,
  busy,
  onDelete,
}: Omit<Props, "index">) {
  return (
    <div className="rotate-[1deg]">
      <BoardMatchCardView
        match={match}
        loopName={loopName}
        busy={busy}
        onDelete={onDelete}
        overlay
      />
    </div>
  );
}
