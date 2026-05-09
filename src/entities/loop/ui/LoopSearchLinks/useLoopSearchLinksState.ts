import { useCallback, useMemo, useState } from "react";

import {
  buildCanonicalFiltersFromLoop,
  buildSearchLinks,
  mapCanonicalToSearchFilters,
} from "../../lib";
import {
  type CanonicalFilters,
  DEFAULT_CANONICAL_FILTERS,
  type LoopPlatform,
} from "../../model";

import type { ActiveLink, LoopForLinks } from "./types";

interface LoopSearchLinksState {
  activeLink: ActiveLink;
  appliedFilters: CanonicalFilters;
  baseFilters: CanonicalFilters;
  draftFilters: CanonicalFilters;
  isDirty: boolean;
  loopId: string;
}

function filtersEqual(a: CanonicalFilters, b: CanonicalFilters) {
  const keys = Object.keys(DEFAULT_CANONICAL_FILTERS) as (keyof CanonicalFilters)[];
  return keys.every((key) => a[key] === b[key]);
}

function createState(loopId: string, baseFilters: CanonicalFilters): LoopSearchLinksState {
  return {
    activeLink: null,
    appliedFilters: baseFilters,
    baseFilters,
    draftFilters: baseFilters,
    isDirty: false,
    loopId,
  };
}

function reconcileState(
  state: LoopSearchLinksState,
  loopId: string,
  baseFilters: CanonicalFilters,
): LoopSearchLinksState {
  if (state.loopId !== loopId) {
    return createState(loopId, baseFilters);
  }

  if (state.isDirty || filtersEqual(state.baseFilters, baseFilters)) {
    return state;
  }

  return createState(loopId, baseFilters);
}

export function useLoopSearchLinksState(loop: LoopForLinks) {
  const baseFromLoop = useMemo(() => buildCanonicalFiltersFromLoop(loop), [loop]);
  const [storedState, setStoredState] = useState<LoopSearchLinksState>(() =>
    createState(loop.id, baseFromLoop),
  );

  const state = useMemo(
    () => reconcileState(storedState, loop.id, baseFromLoop),
    [baseFromLoop, loop.id, storedState],
  );

  const setDraftFilters = useCallback(
    (next: CanonicalFilters) => {
      setStoredState((previous) => {
        const current = reconcileState(previous, loop.id, baseFromLoop);

        return {
          ...current,
          draftFilters: next,
          isDirty: !filtersEqual(next, current.appliedFilters),
        };
      });
    },
    [baseFromLoop, loop.id],
  );

  const links = useMemo(() => {
    return buildSearchLinks(
      loop.platforms,
      mapCanonicalToSearchFilters(state.appliedFilters),
    );
  }, [loop.platforms, state.appliedFilters]);

  const resetFilters = useCallback(() => {
    setStoredState(createState(loop.id, baseFromLoop));
  }, [baseFromLoop, loop.id]);

  const applyDraftFilters = useCallback(() => {
    setStoredState((previous) => {
      const current = reconcileState(previous, loop.id, baseFromLoop);

      return {
        ...current,
        activeLink: null,
        appliedFilters: current.draftFilters,
        isDirty: false,
      };
    });
  }, [baseFromLoop, loop.id]);

  const setActive = useCallback((platform: LoopPlatform, url: string) => {
    setStoredState((previous) => ({
      ...previous,
      activeLink: { platform, url },
    }));
  }, []);

  const setActiveLink = useCallback((next: ActiveLink) => {
    setStoredState((previous) => ({
      ...previous,
      activeLink: next,
    }));
  }, []);

  return {
    draftFilters: state.draftFilters,
    setDraftFilters,

    appliedFilters: state.appliedFilters,
    applyDraftFilters,
    resetFilters,

    activeLink: state.activeLink,
    setActiveLink,
    setActive,

    links,
  };
}
