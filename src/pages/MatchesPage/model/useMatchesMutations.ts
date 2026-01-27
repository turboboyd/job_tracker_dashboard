import React from "react";

import type { LoopMatchStatus } from "src/entities/loop/model/types";
import {
  useDeleteMatchMutation,
  useUpdateMatchMutation,
  useUpdateMatchStatusMutation,
  type UpdateMatchInput,
} from "src/entities/match/api/matchesApi";
import { notify } from "src/shared/lib";
import { getErrorMessage } from "src/shared/lib/errors";

export function useMatchesMutations(userId: string | null) {
  const [updateStatus, updStatus] = useUpdateMatchStatusMutation();
  const [updateMatch, updMatch] = useUpdateMatchMutation();
  const [deleteMatch, del] = useDeleteMatchMutation();

  const busy = updStatus.isLoading || updMatch.isLoading || del.isLoading;

  const safeUserId = React.useCallback(() => {
    if (!userId) {
      notify("error", "You are not signed in.");
      return null;
    }
    return userId;
  }, [userId]);

  const onDelete = React.useCallback(
    async (matchId: string) => {
      const uid = safeUserId();
      if (!uid) return;

      try {
        await deleteMatch({ userId: uid, matchId }).unwrap();
        notify("success", "Match deleted");
      } catch (err) {
        notify("error", `Failed to delete match: ${getErrorMessage(err)}`);
      }
    },
    [deleteMatch, safeUserId]
  );

  const onUpdateStatus = React.useCallback(
    async (matchId: string, status: LoopMatchStatus) => {
      const uid = safeUserId();
      if (!uid) return;

      try {
        await updateStatus({ userId: uid, matchId, status }).unwrap();
        notify("success", "Match updated");
      } catch (err) {
        notify("error", `Failed to update match: ${getErrorMessage(err)}`);
      }
    },
    [safeUserId, updateStatus]
  );

  const onSaveEdit = React.useCallback(
    async (matchId: string, patch: UpdateMatchInput["patch"]) => {
      const uid = safeUserId();
      if (!uid) throw new Error("Not signed in");

      try {
        await updateMatch({ userId: uid, matchId, patch }).unwrap();
        notify("success", "Match saved");
      } catch (err) {
        notify("error", `Failed to save match: ${getErrorMessage(err)}`);
        throw err;
      }
    },
    [safeUserId, updateMatch]
  );

  return { busy, actions: { onDelete, onUpdateStatus, onSaveEdit } };
}
