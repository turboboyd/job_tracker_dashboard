import React from "react";

import {
  useDeleteMatchMutation,
  useUpdateMatchStatusMutation,
  type LoopMatch,
  type LoopMatchStatus,
} from "src/entities/loopMatch";

export type BoardMutations = Readonly<{
  busy: boolean;
  deleteMatch: (args: Readonly<{ matchId: string; loopId: string }>) => Promise<unknown>;
  updateStatus: (args: Readonly<{ matchId: string; loopId: string; status: LoopMatchStatus }>) => Promise<unknown>;
  onDeleteById: (matches: readonly LoopMatch[], matchId: LoopMatch["id"]) => Promise<void>;
}>;

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
    async (args: Readonly<{ matchId: string; loopId: string; status: LoopMatchStatus }>) => {
      return updateStatusTrigger(args);
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
