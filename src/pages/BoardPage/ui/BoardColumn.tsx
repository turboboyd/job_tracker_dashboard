import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import React from "react";
import { useTranslation } from "react-i18next";

import type { BoardColumnKey } from "src/entities/application/model/status";
import type { LoopMatch } from "src/entities/loopMatch";
import { Card } from "src/shared/ui";

import { BoardLane } from "./BoardLane";
import { BoardMatchCard } from "./BoardMatchCard";

type Props = Readonly<{
  status: BoardColumnKey;
  title: string;
  matches: readonly LoopMatch[];
  loopIdToName: ReadonlyMap<string, string>;
  busy: boolean;
  onDelete: (matchId: string) => void | Promise<void>;
}>;

export function BoardColumn({
  status,
  title,
  matches,
  loopIdToName,
  busy,
  onDelete,
}: Props) {
  const { t } = useTranslation();

  const itemIds = React.useMemo(() => matches.map((m) => m.id), [matches]);

  return (
    <div className="w-[calc(100vw-2rem)] md:w-[320px] shrink-0 h-full min-h-0 flex flex-col">
      <Card
        variant="subtle"
        padding="md"
        shadow="none"
        className="shrink-0 mb-sm md:mb-md"
      >
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-foreground">{title}</div>
          <div className="text-xs text-muted-foreground">{matches.length}</div>
        </div>
      </Card>

      <BoardLane status={status}>
        <SortableContext
          id={status}                 
          items={itemIds}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-sm md:gap-md">
            {matches.map((m, i) => (
              <BoardMatchCard
                key={m.id}
                match={m}
                loopName={loopIdToName.get(m.loopId) ?? ""}
                busy={busy}
                onDelete={onDelete}
                index={i}
              />
            ))}
          </div>
        </SortableContext>

        {matches.length === 0 ? (
          <div className="pt-md text-xs text-muted-foreground">
            {t("board.dropHere", "Drop matches here.")}
          </div>
        ) : null}
      </BoardLane>
    </div>
  );
}
