import React from "react";

import type { BoardColumnKey } from "src/entities/application";
import { useAuthSelectors } from "src/features/auth/model";

import { buildBoardColumns, buildLoopIdToName } from "./boardViewModel";
import type { BoardDragPayload, BoardVM } from "./types";
import { fireAndForgetMutation, useBoardMutations } from "./useBoardMutations";
import { useBoardOrderState } from "./useBoardOrderState";
import { useBoardQueries } from "./useBoardQueries";

export function useBoardController(): BoardVM {
  const { userId } = useAuthSelectors();

  const { items, loops, queryState, reload } = useBoardQueries();
  const loopIdToName = React.useMemo(() => buildLoopIdToName(loops), [loops]);

  const { orderByStatus, applyDrop } = useBoardOrderState({ userId, items });

  const { busy, updateStatus, archive } = useBoardMutations();

  const byStatus = React.useMemo(
    () => buildBoardColumns(items, orderByStatus),
    [items, orderByStatus],
  );

  const onDelete = React.useCallback(
    (itemId: string) => {
      fireAndForgetMutation(
        (async () => {
          await archive(itemId);
          await reload();
        })(),
      );
    },
    [archive, reload],
  );

  const onDropToStatus = React.useCallback(
    async (payload: BoardDragPayload, toStatus: BoardColumnKey, _toIndex: number) => {
      if (!userId) return;
      if (busy) return;

      applyDrop(payload, toStatus, _toIndex);

      if (payload.fromStatus === toStatus) return;

      await updateStatus({ itemId: payload.matchId, status: toStatus });
      await reload();
    },
    [applyDrop, busy, reload, updateStatus, userId],
  );

  return {
    busy,
    queries: { matchesQ: queryState },
    data: { items, byStatus, loopIdToName },
    actions: { onDelete, onDropToStatus },
  };
}
