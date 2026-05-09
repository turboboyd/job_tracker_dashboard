import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuthSelectors } from "src/features/auth/model";
import { usePagination } from "src/shared/lib";

import {
  buildMatchesLoopOptions,
  buildMatchesPageItems,
} from "../matchesPage.helpers";

import { matchesFiltersDefaults } from "./filters";
import { buildMatchesResetKey, getPagedMatches, stableFiltersKey } from "./matchesViewModel";
import { useMatchesDerived } from "./useMatchesDerived";
import { useMatchesEditingActions } from "./useMatchesEditingActions";
import { useMatchesMutations } from "./useMatchesMutations";
import { useMatchesPage, writeMatchesStateToUrl } from "./useMatchesPage";
import { useMatchesQueries } from "./useMatchesQueries";

export function useMatchesPageController() {
  const { userId } = useAuthSelectors();

  const navigate = useNavigate();
  const location = useLocation();

  const { matchesQ, loopsQ, matches, loops } = useMatchesQueries();
  const { busy, actions } = useMatchesMutations();

  const { filters, setFilters, reset, visible, initialPage } = useMatchesPage({
    matches,
    search: location.search,
    navigate,
    location,
  });

  const { loopIdToName, platformOptions, statusOptions } = useMatchesDerived(
    matches,
    loops,
  );

  const filtersKey = React.useMemo(() => stableFiltersKey(filters), [filters]);

  const resetKey = React.useMemo(
    () =>
      buildMatchesResetKey({
        userId,
        filtersKey,
        totalMatches: matches.length,
        visibleMatches: visible.length,
      }),
    [userId, filtersKey, matches.length, visible.length],
  );

  const pagination = usePagination({
    totalItems: visible.length,
    pageSize: 6,
    initialPage,
    resetKey,
  });

  const setPage = React.useCallback(
    (next: number | ((prev: number) => number)) => {
      pagination.setPage(next);

      const nextValue =
        typeof next === "function" ? next(pagination.page) : next;
      const safe = Math.max(1, Number(nextValue) || 1);
      writeMatchesStateToUrl({
        navigate,
        location,
        filters,
        page: safe,
        replace: true,
      });
    },
    [pagination, navigate, location, filters],
  );

  const pagedMatches = React.useMemo(
    () => getPagedMatches(visible, pagination.offset, pagination.limit),
    [visible, pagination.offset, pagination.limit],
  );
  const pagedMatchItems = React.useMemo(
    () => buildMatchesPageItems(pagedMatches, loopIdToName),
    [pagedMatches, loopIdToName],
  );

  const loopOptions = React.useMemo(() => buildMatchesLoopOptions(loops), [loops]);
  const pageDisabled = busy || matchesQ.isFetching;

  const resetFilters = React.useCallback(
    () => setFilters(matchesFiltersDefaults),
    [setFilters],
  );

  const onReset = reset ?? resetFilters;

  const editing = useMatchesEditingActions({ actions, loopIdToName, matches });

  return {
    userId,
    queries: { matchesQ, loopsQ },
    busy,

    matches,
    loops,
    matchesCount: matches.length,
    visibleCount: visible.length,

    loopIdToName,
    platformOptions,
    statusOptions,
    loopOptions,

    filters,
    setFilters,
    onReset,

    visible,
    pagination: { ...pagination, setPage },
    pagedMatches,
    pagedMatchItems,
    pageDisabled,

    editingMatch: editing.editingMatch,
    editingLoopName: editing.editingLoopName,
    openEdit: editing.openEdit,
    closeEdit: editing.closeEdit,

    actions: {
      onDelete: editing.onDelete,
      onUpdateStatus: editing.onUpdateStatus,
      onSaveEdit: editing.onSaveEdit,
    },
  };
}
