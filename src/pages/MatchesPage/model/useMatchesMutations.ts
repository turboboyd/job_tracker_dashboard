import React from "react";

import {
  useDeleteMatchMutation,
  useUpdateMatchMutation,
  useUpdateMatchStatusMutation,
  type UpdateMatchInput,
} from "src/entities/loopMatch";
import type { LoopMatchStatus } from "src/entities/loopMatch";
import { useAuthSelectors } from "src/features/auth";
import { notify } from "src/shared/lib";
import { getErrorMessage } from "src/shared/lib/errors";

/**
 * All match mutations.
 *
 * NOTE: we do NOT pass `userId` anymore.
 * Firestore ownership is derived from the document path: users/{uid}/loopMatches/... 
 */
export function useMatchesMutations() {
  const { isAuthReady, isAuthenticated } = useAuthSelectors();

  const [updateStatus, updStatus] = useUpdateMatchStatusMutation();
  const [updateMatch, updMatch] = useUpdateMatchMutation();
  const [deleteMatch, del] = useDeleteMatchMutation();

  const busy = updStatus.isLoading || updMatch.isLoading || del.isLoading;

  const guardAuth = React.useCallback(() => {
    if (!isAuthReady || !isAuthenticated) {
      notify("error", "You are not signed in.");
      return false;
    }
    return true;
  }, [isAuthReady, isAuthenticated]);

  const onDelete = React.useCallback(
    async (matchId: string, loopId: string) => {
      if (!guardAuth()) return;

      try {
        await deleteMatch({ matchId, loopId }).unwrap();
        notify("success", "Match deleted");
      } catch (err) {
        notify("error", `Failed to delete match: ${getErrorMessage(err)}`);
      }
    },
    [deleteMatch, guardAuth]
  );

  const onUpdateStatus = React.useCallback(
    async (matchId: string, loopId: string, status: LoopMatchStatus) => {
      if (!guardAuth()) return;

      try {
        await updateStatus({ matchId, loopId, status }).unwrap();
        notify("success", "Match updated");
      } catch (err) {
        notify("error", `Failed to update match: ${getErrorMessage(err)}`);
      }
    },
    [guardAuth, updateStatus]
  );

  const onSaveEdit = React.useCallback(
    async (matchId: string, patch: UpdateMatchInput["patch"]) => {
      if (!guardAuth()) throw new Error("Not signed in");

      try {
        await updateMatch({ matchId, patch }).unwrap();
        notify("success", "Match saved");
      } catch (err) {
        notify("error", `Failed to save match: ${getErrorMessage(err)}`);
        throw err;
      }
    },
    [guardAuth, updateMatch]
  );

  return { busy, actions: { onDelete, onUpdateStatus, onSaveEdit } };
}
