import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import React from "react";

import type { BoardColumnKey } from "src/entities/application/model/status";

import type { BoardCardItem } from "../model/types";

import { BoardLane } from "./BoardLane";
import { BoardMatchCard } from "./BoardMatchCard";

type Props = Readonly<{
  status: BoardColumnKey;
  title: string;
  color?: string;
  items: readonly BoardCardItem[];
  loopIdToName: ReadonlyMap<string, string>;
  busy: boolean;
  onArchive: (itemId: string) => void | Promise<void>;
}>;

export function BoardColumn({
  status,
  title,
  color,
  items,
  loopIdToName,
  busy,
  onArchive,
}: Props) {
  const itemIds = React.useMemo(() => items.map((m) => m.id), [items]);

  return (
    <div className="w-[calc(100vw-2rem)] md:w-[280px] shrink-0 h-full min-h-0 flex flex-col">
      {/* Column container */}
      <div className="flex flex-col h-full min-h-0 rounded-[10px] border border-border bg-muted p-2.5">
        {/* Column header */}
        <div className="flex items-center justify-between px-1 pb-2.5">
          <div className="flex items-center gap-2">
            {/* Colored dot */}
            <span
              className="h-2 w-2 rounded-[2px] shrink-0"
              style={{ background: color }}
            />
            <span className="text-[13px] font-semibold tracking-[-0.01em] text-foreground">
              {title}
            </span>
            {/* Count badge */}
            <span className="text-[10.5px] px-[6px] py-px rounded-full border border-border bg-card text-subtle-foreground tabular-nums">
              {items.length}
            </span>
          </div>
          <button
            type="button"
            className="flex items-center justify-center rounded-[5px] p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Scrollable cards area */}
        <BoardLane status={status}>
          <SortableContext
            id={status}
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2">
              {items.map((m, i) => (
                <BoardMatchCard
                  key={m.id}
                  item={m}
                  loopName={loopIdToName.get(m.loopId) ?? ""}
                  busy={busy}
                  onArchive={onArchive}
                  index={i}
                />
              ))}
            </div>
          </SortableContext>

          {items.length === 0 && (
            <div className="rounded-[8px] border border-dashed border-border px-3 py-6 text-center text-[11.5px] text-muted-foreground">
              Перетащи заявки сюда
            </div>
          )}
        </BoardLane>
      </div>
    </div>
  );
}
