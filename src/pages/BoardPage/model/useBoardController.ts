import React from "react";

import { useAuthSelectors } from "src/entities/auth";
import { LOOP_MATCH_STATUSES } from "src/entities/loop";
import type { LoopMatch, LoopMatchStatus } from "src/entities/loopMatch";

import { groupMatchesByStatus } from "./grouping";
import { sortByOrder } from "./order";
import type { BoardDragPayload, BoardVM } from "./types";
import { useBoardMutations, fireAndForgetMutation } from "./useBoardMutations";
import { useBoardOrderState } from "./useBoardOrderState";
import { useBoardQueries } from "./useBoardQueries";

function buildLoopIdToName(loops: ReadonlyArray<{ id: string; name: string }>): ReadonlyMap<string, string> {
  const map = new Map<string, string>();
  for (const l of loops) map.set(l.id, l.name);
  return map;
}

function findMatchById(matches: readonly LoopMatch[], matchId: string): LoopMatch | undefined {
  return matches.find((m) => m.id === matchId);
}

function buildBoardColumns(
  matches: readonly LoopMatch[],
  orderByStatus: Record<LoopMatchStatus, string[]>,
): ReadonlyMap<LoopMatchStatus, readonly LoopMatch[]> {
  const grouped = groupMatchesByStatus(matches);


  for (const s of LOOP_MATCH_STATUSES) {
    const status = s.value;
    const list = grouped.get(status) ?? [];
    const ordered = sortByOrder(list, orderByStatus[status] ?? []);
    grouped.set(status, ordered);
  }

  return grouped as ReadonlyMap<LoopMatchStatus, readonly LoopMatch[]>;
}

export function useBoardController(): BoardVM {
  const { userId } = useAuthSelectors();


  const { loops, matches, matchesQ } = useBoardQueries();
  const loopIdToName = React.useMemo(() => buildLoopIdToName(loops), [loops]);


  const { orderByStatus, applyDrop } = useBoardOrderState({ userId, matches });


  const { busy, onDeleteById, updateStatus } = useBoardMutations();


  const byStatus = React.useMemo(
    () => buildBoardColumns(matches, orderByStatus),
    [matches, orderByStatus],
  );


  const onDelete = React.useCallback(
    (matchId: string) => {
      fireAndForgetMutation(onDeleteById(matches, matchId));
    },
    [matches, onDeleteById],
  );

  const onDropToStatus = React.useCallback(
    async (payload: BoardDragPayload, toStatus: LoopMatchStatus, toIndex: number) => {
      if (!userId) return;
      if (busy) return;


      applyDrop(payload, toStatus, toIndex);


      if (payload.fromStatus === toStatus) return;

      const match = findMatchById(matches, payload.matchId);
      if (!match) return;

      await updateStatus({ matchId: match.id, loopId: match.loopId, status: toStatus });
    },
    [applyDrop, busy, matches, updateStatus, userId],
  );

  return {
    busy,
    queries: { matchesQ },
    data: { matches, byStatus, loopIdToName },
    actions: { onDelete, onDropToStatus },
  };
}
