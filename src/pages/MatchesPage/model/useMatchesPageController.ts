import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { UpdateMatchInput, LoopMatchStatus } from "src/entities/loopMatch";
import { useAuthSelectors } from "src/features/auth";
import { usePagination } from "src/shared/lib/pagination/usePagination";

import { matchesFiltersDefaults } from "./filters";
import { useMatchesDerived } from "./useMatchesDerived";
import { useMatchesMutations } from "./useMatchesMutations";
import { useMatchesPage, writeMatchesStateToUrl } from "./useMatchesPage";
import { useMatchesQueries } from "./useMatchesQueries";

function stableFiltersKey(filters: unknown): string {
  const seen = new WeakSet<object>();

  const sortDeep = (val: unknown): unknown => {
    if (val === null || typeof val !== "object") return val;

    if (val instanceof Date) return val.toISOString();

    if (Array.isArray(val)) {
      return val.map(sortDeep);
    }

    if (seen.has(val as object)) return "[Circular]";
    seen.add(val as object);

    const obj = val as Record<string, unknown>;
    const keys = Object.keys(obj).sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );

    const out: Record<string, unknown> = {};
    for (const k of keys) out[k] = sortDeep(obj[k]);
    return out;
  };

  try {
    return JSON.stringify(sortDeep(filters));
  } catch {
    return String(filters);
  }
}

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

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { loopIdToName, platformOptions, statusOptions } = useMatchesDerived(
    matches,
    loops,
  );

  const filtersKey = React.useMemo(() => stableFiltersKey(filters), [filters]);

  const resetKey = React.useMemo(() => {
    return [
      `userId:${userId ?? "anon"}`,
      `filters:${filtersKey}`,
      `total:${matches.length}`,
      `visible:${visible.length}`,
    ].join("|");
  }, [userId, filtersKey, matches.length, visible.length]);

  const pagination = usePagination({
    totalItems: visible.length,
    pageSize: 6,
    initialPage,
    resetKey,
  });

  const setPage = React.useCallback(
    (next: number | ((prev: number) => number)) => {
      pagination.setPage(next);

      const nextValue = typeof next === "function" ? next(pagination.page) : next;
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

  const pagedMatches = React.useMemo(() => {
    return visible.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );
  }, [visible, pagination.offset, pagination.limit]);

  const editingMatch = React.useMemo(() => {
    if (!editingId) return null;
    return matches.find((m) => m.id === editingId) ?? null;
  }, [editingId, matches]);

  const resetFilters = React.useCallback(
    () => setFilters(matchesFiltersDefaults),
    [setFilters],
  );

  const onReset = reset ?? resetFilters;

  const onSaveEdit = React.useCallback(
    async (matchId: string, patch: UpdateMatchInput["patch"]) => {
      await actions.onSaveEdit(matchId, patch);
      setEditingId(null);
    },
    [actions],
  );

  return {
    userId,
    queries: { matchesQ, loopsQ },
    busy,

    matches,
    loops,

    loopIdToName,
    platformOptions,
    statusOptions,

    filters,
    setFilters,
    onReset,

    visible,
    pagination: { ...pagination, setPage },
    pagedMatches,

    editingMatch,
    setEditingId,

    actions: {
      onDelete: async (matchId: string) => {
        const m = matches.find((x) => x.id === matchId);
        if (!m) return;
        await actions.onDelete(m.id, m.loopId);
      },
      onUpdateStatus: async (matchId: string, status: LoopMatchStatus) => {
        const m = matches.find((x) => x.id === matchId);
        if (!m) return;
        await actions.onUpdateStatus(m.id, m.loopId, status);
      },
      onSaveEdit,
    },
  };
}
