import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import React from "react";

import { classNames } from "src/shared/lib";

import type { BoardCardItem } from "../model/types";

import { BoardMatchCardView } from "./BoardMatchCardView";

type Props = Readonly<{
  item: BoardCardItem;
  loopName: string;
  busy: boolean;
  onArchive: (itemId: BoardCardItem["id"]) => void | Promise<void>;
  index: number;
  overlay?: boolean;
}>;

export function BoardMatchCard({ item, loopName, busy, onArchive, index }: Props) {
  const { setNodeRef, attributes, listeners, transform, transition, isDragging } =
    useSortable({
      id: item.id,
      disabled: busy,
      data: {
        matchId: item.id,
        status: item.status,
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
        "select-none touch-manipulation",
        isDragging ? "touch-none pointer-events-none" : "touch-pan-y",
        isDragging && "z-10",
      )}
      {...attributes}
      {...listeners}
    >
      <BoardMatchCardView
        item={item}
        loopName={loopName}
        busy={busy}
        onArchive={onArchive}
        overlay={false}
      />
    </div>
  );
}


export function BoardMatchCardOverlay({
  item,
  loopName,
  busy,
  onArchive,
}: Omit<Props, "index">) {
  return (
    <div className="rotate-[1deg]">
      <BoardMatchCardView
        item={item}
        loopName={loopName}
        busy={busy}
        onArchive={onArchive}
        overlay
      />
    </div>
  );
}
