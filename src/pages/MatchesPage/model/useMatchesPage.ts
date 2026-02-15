import React from "react";
import type { Location, NavigateFunction } from "react-router-dom";

import { updateURLParams } from "src/shared/lib/url/updateURLParams";

import type { MatchesFiltersState, TypeMatch } from "./filters";
import { matchesFiltersDefaults, selectVisibleMatches } from "./filters";


const CSV_SEP = ",";

function readCsv(sp: URLSearchParams, key: string): string[] {
  const raw = sp.get(key);
  if (!raw) return [];
  return raw
    .split(CSV_SEP)
    .map((s) => s.trim())
    .filter(Boolean);
}

function writeCsv(values: string[]): string | null {
  const v = values.map((s) => String(s).trim()).filter(Boolean);
  return v.length ? v.join(CSV_SEP) : null;
}

export function readMatchesStateFromSearch(search: string): {
  filters: MatchesFiltersState;
  page: number;
} {
  const sp = new URLSearchParams(search);

  const q = sp.get("q") ?? matchesFiltersDefaults.q;
  const sort = (sp.get("sort") as MatchesFiltersState["sort"]) ?? matchesFiltersDefaults.sort;
  const loopIds = readCsv(sp, "loop");
  const platforms = readCsv(sp, "platform");
  const statuses = readCsv(sp, "status") as MatchesFiltersState["statuses"];

  const pageRaw = sp.get("page");
  const page = Math.max(1, Number(pageRaw ?? 1) || 1);

  return {
    filters: {
      q,
      sort,
      loopIds,
      platforms,
      statuses,
    },
    page,
  };
}

export function writeMatchesStateToUrl(args: {
  navigate: NavigateFunction;
  location: Location;
  filters: MatchesFiltersState;
  page: number;
  replace?: boolean;
}) {
  const { navigate, location, filters, page, replace = true } = args;

  updateURLParams(
    navigate,
    location,
    {
      q: filters.q.trim() || null,
      sort: filters.sort !== matchesFiltersDefaults.sort ? filters.sort : null,

      loop: writeCsv(filters.loopIds),
      platform: writeCsv(filters.platforms),
      status: writeCsv(filters.statuses),

      page: page > 1 ? page : null,
    },
    { replace },
  );
}

export function useMatchesPage(args: {
  matches: TypeMatch[];
  /** Route location.search */
  search: string;
  navigate: NavigateFunction;
  location: Location;
}) {
  const { matches, search, navigate, location } = args;

  const initial = React.useMemo(() => readMatchesStateFromSearch(search), [search]);

  const [filters, setFiltersState] = React.useState<MatchesFiltersState>(initial.filters);

  // Keep URL -> state in sync on first render only. We intentionally do not
  // react to URL edits after mount to avoid complex bidirectional sync.
  const didInitRef = React.useRef(false);
  React.useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;
    setFiltersState(initial.filters);
  }, [initial.filters]);

  const visible = React.useMemo(() => {
    return selectVisibleMatches(matches, filters);
  }, [matches, filters]);

  const setFilters = React.useCallback(
    (next: MatchesFiltersState) => {
      setFiltersState(next);
      // Any filter change should reset pagination to page 1 in URL.
      writeMatchesStateToUrl({ navigate, location, filters: next, page: 1, replace: true });
    },
    [navigate, location],
  );

  const reset = React.useCallback(() => {
    setFiltersState(matchesFiltersDefaults);
    writeMatchesStateToUrl({ navigate, location, filters: matchesFiltersDefaults, page: 1, replace: true });
  }, [navigate, location]);

  return { filters, setFilters, reset, visible, initialPage: initial.page };
}
