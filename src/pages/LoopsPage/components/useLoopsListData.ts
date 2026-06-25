import { useCallback, useEffect, useMemo, useState } from "react";

import type { Loop } from "src/entities/loop";
import { listApplicationsViaRest } from "src/features/applications/rest/queries";
import { listLoopsViaRest } from "src/features/loops";
import { listLoopVacancyMatchesViaRest, type VacancyMatch } from "src/features/vacancyMatches";
import type { AppRow } from "src/pages/ApplicationsPage/model/types";
import { getErrorMessage } from "src/shared/lib";

import { APPLICATIONS_PAGE_SIZE } from "./loopListView.helpers";
import {
  buildLoopStatsById,
  countEffectiveLoopStats,
  filterLoopsByTab,
  getBackendLoopIdsForMatchLoading,
  type LoopStats,
  type LoopStatsById,
} from "./loopsPage.helpers";

export interface LoopsListData {
  loops: Loop[];
  isLoadingLoops: boolean;
  isLoadingApplications: boolean;
  loopsError: string | null;
  statsError: string | null;
  statsLoops: Loop[];
  statsById: LoopStatsById;
  activeTotals: LoopStats;
  reloadLoops: () => Promise<void>;
}

async function loadAllActiveApplications(userId: string): Promise<AppRow[]> {
  const rows: AppRow[] = [];
  let offset = 0;
  let total = 0;

  do {
    const page = await listApplicationsViaRest(userId, {
      archived: false,
      limit: APPLICATIONS_PAGE_SIZE,
      offset,
      sort: "updated_at_desc",
    });
    rows.push(...page.items);
    total = page.total;
    offset = page.offset + page.limit;

    if (page.items.length === 0) break;
  } while (offset < total);

  return rows;
}

/**
 * Loads the loops list plus the applications/matches needed to derive the
 * per-loop F16 stat counters. Behaviour mirrors the original LoopsListView
 * container exactly: loops are fetched with archived included; matches and
 * applications are only fetched when the loops lack server-side `metrics` (the
 * `backendLoopIdsKey` gate), and each fetch is cancellation-guarded.
 */
export function useLoopsListData(userId: string): LoopsListData {
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);
  const [loopsError, setLoopsError] = useState<string | null>(null);

  const statsLoops = useMemo(() => filterLoopsByTab(loops, "active"), [loops]);

  const hasServerMetrics = useMemo(
    () => loops.length > 0 && loops.every((l) => l.metrics != null),
    [loops],
  );

  const backendLoopIdsKey = useMemo(
    () => (hasServerMetrics ? "" : getBackendLoopIdsForMatchLoading(loops).join("|")),
    [hasServerMetrics, loops],
  );

  const statsById = useMemo(
    () => buildLoopStatsById({ loops, applications, matches }),
    [applications, loops, matches],
  );
  const activeTotals = useMemo(
    () => countEffectiveLoopStats(statsById, statsLoops),
    [statsById, statsLoops],
  );

  const loadLoops = useCallback(async () => {
    if (!userId) {
      setLoops([]);
      return;
    }

    setIsLoadingLoops(true);
    setLoopsError(null);
    try {
      const response = await listLoopsViaRest({ includeArchived: true, limit: 100 });
      setLoops(response.items);
    } catch (error: unknown) {
      setLoops([]);
      setLoopsError(getErrorMessage(error));
    } finally {
      setIsLoadingLoops(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadLoops();
  }, [loadLoops]);

  useEffect(() => {
    let cancelled = false;
    const loopIds = backendLoopIdsKey ? backendLoopIdsKey.split("|") : [];

    async function loadMatches() {
      if (!userId || loopIds.length === 0) {
        setMatches([]);
        return;
      }

      try {
        const pages = await Promise.all(
          loopIds.map((loopId) =>
            listLoopVacancyMatchesViaRest(loopId, { limit: 100, offset: 0 }),
          ),
        );
        if (!cancelled) setMatches(pages.flatMap((page) => page.items));
      } catch {
        if (!cancelled) setMatches([]);
      }
    }

    loadMatches().catch(() => {
      if (!cancelled) setMatches([]);
    });

    return () => {
      cancelled = true;
    };
  }, [backendLoopIdsKey, userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      if (!userId || !backendLoopIdsKey) {
        setApplications([]);
        return;
      }

      setIsLoadingApplications(true);
      setStatsError(null);

      try {
        const rows = await loadAllActiveApplications(userId);
        if (!cancelled) setApplications(rows);
      } catch {
        if (!cancelled) setApplications([]);
      } finally {
        if (!cancelled) setIsLoadingApplications(false);
      }
    }

    loadApplications().catch(() => {
      if (!cancelled) setApplications([]);
    });

    return () => {
      cancelled = true;
    };
  }, [backendLoopIdsKey, userId]);

  return {
    loops,
    isLoadingLoops,
    isLoadingApplications,
    loopsError,
    statsError,
    statsLoops,
    statsById,
    activeTotals,
    reloadLoops: loadLoops,
  };
}
