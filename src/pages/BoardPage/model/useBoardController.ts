import React from "react";

import type { BoardColumnKey } from "src/entities/application";
import { useAuthSelectors } from "src/features/auth/model";

import { buildBoardColumns, buildLoopIdToName, findMatchById } from "./boardViewModel";
import type { BoardDragPayload, BoardVM } from "./types";
import { fireAndForgetMutation, useBoardMutations } from "./useBoardMutations";
import { useBoardOrderState } from "./useBoardOrderState";
import { useBoardQueries } from "./useBoardQueries";

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
    async (payload: BoardDragPayload, toStatus: BoardColumnKey, toIndex: number) => {
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
