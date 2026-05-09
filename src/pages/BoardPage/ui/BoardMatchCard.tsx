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
    // Prevent "snap back"/jitter while dragging (especially noticeable on Safari).
    transition: isDragging ? undefined : transition,
    opacity: isDragging ? 0.35 : 1,
    // iOS Safari: prevent callout/selection while long-pressing.
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      // Mobile: keep vertical scroll usable while still allowing drag after long-press.
      className={classNames(
        // IMPORTANT for iOS Safari:
        // - while dragging, disable browser scrolling/gesture handling on the draggable
        //   element (otherwise pointer events can get "lost" and the drag feels broken).
        // - when not dragging, allow normal vertical scrolling inside lanes.
        "select-none touch-manipulation",
        isDragging ? "touch-none pointer-events-none" : "touch-pan-y",
        isDragging && "z-10",
      )}
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
