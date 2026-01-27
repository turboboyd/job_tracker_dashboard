import React from "react";

import { UpdateMatchInput } from "src/entities/match/api/matchesApi";
import { matchesFiltersDefaults } from "src/entities/match/model";
import { useAuth } from "src/shared/lib";
import { usePagination } from "src/shared/lib/pagination/usePagination";

import { useMatchesDerived } from "./useMatchesDerived";
import { useMatchesMutations } from "./useMatchesMutations";
import { useMatchesPage } from "./useMatchesPage";
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
      a.localeCompare(b, undefined, { sensitivity: "base" })
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
  const { user } = useAuth();
  const userId = user?.uid ?? null;

  const { matchesQ, loopsQ, matches, loops } = useMatchesQueries(userId);
  const { busy, actions } = useMatchesMutations(userId);

  const { filters, setFilters, reset, visible } = useMatchesPage({ matches });

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { loopIdToName, platformOptions, statusOptions } = useMatchesDerived(
    matches,
    loops
  );

  const filtersKey = React.useMemo(() => stableFiltersKey(filters), [filters]);

  const resetKey = React.useMemo(() => {
    return [
      `uid:${userId ?? "anon"}`,
      `filters:${filtersKey}`,
      `total:${matches.length}`,
      `visible:${visible.length}`,
    ].join("|");
  }, [userId, filtersKey, matches.length, visible.length]);

  const pagination = usePagination({
    totalItems: visible.length,
    pageSize: 10,
    resetKey,
  });

  const pagedMatches = React.useMemo(() => {
    return visible.slice(
      pagination.offset,
      pagination.offset + pagination.limit
    );
  }, [visible, pagination.offset, pagination.limit]);

  const editingMatch = React.useMemo(() => {
    if (!editingId) return null;
    return matches.find((m) => m.id === editingId) ?? null;
  }, [editingId, matches]);

  const resetFilters = React.useCallback(
    () => setFilters(matchesFiltersDefaults),
    [setFilters]
  );

  const onReset = reset ?? resetFilters;

  const onSaveEdit = React.useCallback(
    async (matchId: string, patch: UpdateMatchInput["patch"]) => {
      await actions.onSaveEdit(matchId, patch);
      setEditingId(null);
    },
    [actions]
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
    pagination,
    pagedMatches,

    editingMatch,
    setEditingId,

    actions: {
      onDelete: actions.onDelete,
      onUpdateStatus: actions.onUpdateStatus,
      onSaveEdit,
    },
  };
}
