import React from "react";

import type { BoardColumnKey } from "src/entities/application";

import { createEmptyOrder, ensureIdsExist, loadOrder, saveOrder } from "./order";
import type { BoardCardItem, BoardDragPayload, BoardOrderByStatus } from "./types";


export type BoardOrderController = Readonly<{
  orderByStatus: BoardOrderByStatus;
  applyDrop: (payload: BoardDragPayload, toStatus: BoardColumnKey, toIndex: number) => void;
}>;

export function useBoardOrderState(params: Readonly<{
  userId: string | null | undefined;
  items: readonly BoardCardItem[];
}>): BoardOrderController {
  const { userId, items } = params;


  const [orderByStatus, setOrderByStatus] = React.useState<BoardOrderByStatus>(() => {
    if (!userId) return createEmptyOrder();
    return loadOrder(userId);
  });

  React.useEffect(() => {
    if (!userId) {
      setOrderByStatus(createEmptyOrder());
      return;
    }
    setOrderByStatus(loadOrder(userId));
  }, [userId]);


  React.useEffect(() => {
    if (!userId) return;

    setOrderByStatus((prev) => {
      const next: BoardOrderByStatus = { ...prev };
      ensureIdsExist(next, items);
      saveOrder(userId, next);
      return next;
    });
  }, [items, userId]);

  const applyDrop = React.useCallback(
    (payload: BoardDragPayload, toStatus: BoardColumnKey, toIndex: number) => {
      if (!userId) return;

      setOrderByStatus((prev) => {
        const next: BoardOrderByStatus = { ...prev };

        const fromArr = [...(next[payload.fromStatus] ?? [])];
        const toArr = payload.fromStatus === toStatus ? fromArr : [...(next[toStatus] ?? [])];

        const currentFromIndex = fromArr.indexOf(payload.matchId);
        if (currentFromIndex !== -1) fromArr.splice(currentFromIndex, 1);

        const safeIndex = Math.max(0, Math.min(toIndex, toArr.length));
        toArr.splice(safeIndex, 0, payload.matchId);

        next[payload.fromStatus] = payload.fromStatus === toStatus ? toArr : fromArr;
        next[toStatus] = toArr;

        saveOrder(userId, next);
        return next;
      });
    },
    [userId],
  );

  return { orderByStatus, applyDrop };
}
