import React from "react";

import type { BoardColumnKey, StatusKey } from "src/entities/application/model/status";
import {
  useDeleteMatchMutation,
  useUpdateMatchStatusMutation,
  type LoopMatch,
} from "src/entities/loopMatch";

export type BoardMutations = Readonly<{
  busy: boolean;
  deleteMatch: (args: Readonly<{ matchId: string; loopId: string }>) => Promise<unknown>;
  updateStatus: (args: Readonly<{ matchId: string; loopId: string; status: BoardColumnKey }>) => Promise<unknown>;
  onDeleteById: (matches: readonly LoopMatch[], matchId: LoopMatch["id"]) => Promise<void>;
}>;

const COLUMN_DEFAULT_STATUS: Record<BoardColumnKey, StatusKey> = {
  ACTIVE: "APPLIED",
  INTERVIEW: "HR_CALL_SCHEDULED",
  OFFER: "OFFER_RECEIVED",
  HIRED: "OFFER_ACCEPTED",
  REJECTED: "REJECTED_PRE_INTERVIEW",
  NO_RESPONSE: "GHOSTING",
  ARCHIVED: "ARCHIVED_GENERAL",
};

function fireAndForget(p: Promise<unknown>): void {
  p.catch(() => {
    // Errors are handled by RTK Query state in UI.
  });
}


export function useBoardMutations(): BoardMutations {
  const [deleteMatchTrigger, deleteState] = useDeleteMatchMutation();
  const [updateStatusTrigger, updateState] = useUpdateMatchStatusMutation();

  const busy = Boolean(deleteState.isLoading || updateState.isLoading);

  const deleteMatch = React.useCallback(
    async (args: Readonly<{ matchId: string; loopId: string }>) => {
      return deleteMatchTrigger(args);
    },
    [deleteMatchTrigger],
  );

  const updateStatus = React.useCallback(
    async (args: Readonly<{ matchId: string; loopId: string; status: BoardColumnKey }>) => {
      return updateStatusTrigger({
        matchId: args.matchId,
        loopId: args.loopId,
        status: COLUMN_DEFAULT_STATUS[args.status],
      });
    },
    [updateStatusTrigger],
  );

  const onDeleteById = React.useCallback(
    async (matches: readonly LoopMatch[], matchId: LoopMatch["id"]) => {
      const match = matches.find((m) => m.id === matchId);
      if (!match) return;
      await deleteMatch({ matchId: match.id, loopId: match.loopId });
    },
    [deleteMatch],
  );

  return {
    busy,
    deleteMatch,
    updateStatus,
    onDeleteById,
  };
}


export function fireAndForgetMutation(p: Promise<unknown>): void {
  fireAndForget(p);
}
