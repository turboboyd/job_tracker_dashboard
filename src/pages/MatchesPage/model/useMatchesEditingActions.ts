import React from "react";

import type { LoopMatchStatus, UpdateMatchInput } from "src/entities/loopMatch";

import { getMatchesLoopName } from "../matchesPage.helpers";

import type { TypeMatch } from "./filters";
import { findMatchById } from "./matchesViewModel";

interface MatchesActions {
  onDelete: (matchId: string, loopId: string) => Promise<void>;
  onSaveEdit: (matchId: string, patch: UpdateMatchInput["patch"]) => Promise<void>;
  onUpdateStatus: (
    matchId: string,
    loopId: string,
    status: LoopMatchStatus,
  ) => Promise<void>;
}

interface UseMatchesEditingActionsParams {
  actions: MatchesActions;
  loopIdToName: ReadonlyMap<string, string>;
  matches: TypeMatch[];
}

export function useMatchesEditingActions({
  actions,
  loopIdToName,
  matches,
}: UseMatchesEditingActionsParams) {
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const editingMatch = React.useMemo(
    () => findMatchById(matches, editingId),
    [editingId, matches],
  );
  const editingLoopName = React.useMemo(
    () => getMatchesLoopName(loopIdToName, editingMatch?.loopId),
    [editingMatch?.loopId, loopIdToName],
  );
  const findExistingMatch = React.useCallback(
    (matchId: string) => findMatchById(matches, matchId),
    [matches],
  );

  const onSaveEdit = React.useCallback(
    async (matchId: string, patch: UpdateMatchInput["patch"]) => {
      await actions.onSaveEdit(matchId, patch);
      setEditingId(null);
    },
    [actions],
  );

  const openEdit = React.useCallback((matchId: string) => {
    setEditingId(matchId);
  }, []);

  const closeEdit = React.useCallback(() => {
    setEditingId(null);
  }, []);

  const onDelete = React.useCallback(
    async (matchId: string) => {
      const match = findExistingMatch(matchId);
      if (!match) return;
      await actions.onDelete(match.id, match.loopId);
    },
    [actions, findExistingMatch],
  );

  const onUpdateStatus = React.useCallback(
    async (matchId: string, status: LoopMatchStatus) => {
      const match = findExistingMatch(matchId);
      if (!match) return;
      await actions.onUpdateStatus(match.id, match.loopId, status);
    },
    [actions, findExistingMatch],
  );

  return {
    closeEdit,
    editingLoopName,
    editingMatch,
    onDelete,
    onSaveEdit,
    onUpdateStatus,
    openEdit,
  };
}
