import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import type { LoopMatchStatus, UpdateMatchInput } from "src/entities/loopMatch";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import { useMatchesDerived } from "../MatchesPage/model/useMatchesDerived";
import { useMatchesMutations } from "../MatchesPage/model/useMatchesMutations";
import { useMatchesQueries } from "../MatchesPage/model/useMatchesQueries";

import {
  buildMatchDetailsLabels,
  buildMatchDetailsState,
  buildMatchDetailsViewModel,
  findMatchById,
  getLoopName,
  getMatchDetailsBackTo,
} from "./matchDetails.helpers";

export function useMatchDetailsPageController() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const matchId = String(params.matchId ?? "");
  const backTo = React.useMemo(() => getMatchDetailsBackTo(location), [location]);
  const labels = React.useMemo(() => buildMatchDetailsLabels(t), [t]);

  const { matchesQ, loopsQ, matches, loops } = useMatchesQueries();
  const { busy, actions } = useMatchesMutations();
  const { loopIdToName } = useMatchesDerived(matches, loops);

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const match = React.useMemo(
    () => findMatchById(matches, matchId),
    [matches, matchId],
  );
  const loopName = React.useMemo(
    () => getLoopName(loopIdToName, match?.loopId),
    [loopIdToName, match?.loopId],
  );
  const editingMatch = React.useMemo(
    () => findMatchById(matches, editingId),
    [editingId, matches],
  );
  const editingLoopName = React.useMemo(
    () => getLoopName(loopIdToName, editingMatch?.loopId),
    [editingMatch?.loopId, loopIdToName],
  );

  const loading = matchesQ.isLoading || loopsQ.isLoading;
  const error = React.useMemo(() => {
    if (matchesQ.isError) {
      return matchesQ.error;
    }

    if (loopsQ.isError) {
      return loopsQ.error;
    }

    return null;
  }, [loopsQ.error, loopsQ.isError, matchesQ.error, matchesQ.isError]);
  const state = React.useMemo(
    () =>
      buildMatchDetailsState({
        error,
        labels,
        loading,
        match,
      }),
    [error, labels, loading, match],
  );
  const details = React.useMemo(
    () => (match ? buildMatchDetailsViewModel(match, loopName, labels) : null),
    [labels, loopName, match],
  );

  const closeEdit = React.useCallback(() => {
    setEditingId(null);
  }, []);
  const openEdit = React.useCallback(() => {
    if (match) {
      setEditingId(match.id);
    }
  }, [match]);

  const onDelete = React.useCallback(async () => {
    if (!match) return;
    await actions.onDelete(match.id, match.loopId);
    void navigate(RoutePath[AppRoutes.MATCHES], { replace: true });
  }, [actions, match, navigate]);

  const onUpdateStatus = React.useCallback(
    async (status: LoopMatchStatus) => {
      if (!match) return;
      await actions.onUpdateStatus(match.id, match.loopId, status);
    },
    [actions, match],
  );

  const onSaveEdit = React.useCallback(
    async (id: string, patch: UpdateMatchInput["patch"]) => {
      await actions.onSaveEdit(id, patch);
      closeEdit();
    },
    [actions, closeEdit],
  );

  return {
    backTo,
    busy,
    closeEdit,
    details,
    editingLoopName,
    editingMatch,
    labels,
    openEdit,
    state,
    actions: {
      onDelete,
      onSaveEdit,
      onUpdateStatus,
    },
  };
}
