import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { runDiscoveryViaRest } from "src/features/discoveryRuns";
import {
  createApplicationFromVacancyMatchViaRest,
  listMatchesFeedViaRest,
  markLoopVacancyMatchSeenViaRest,
  patchLoopVacancyMatchViaRest,
  type MatchesFeedCounts,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import {
  buildSourceBuckets,
  MATCHES_V2_PAGE_SIZE,
  type MatchWithLoopName,
  type SortKey,
  type SourceBucket,
  type StatusTab,
} from "./matchesV2.helpers";

// The loopId param is carried only so we can render a "Назад к циклу" crumb when
// the user arrived from a loop page. It is NOT a feed filter — the Matches list
// is always the unified cross-loop feed (fixes the "only one loop shows" bug).
function buildMatchDetailsRoute(match: VacancyMatch): string {
  return `/dashboard/matches/${encodeURIComponent(match.id)}?loopId=${encodeURIComponent(match.loopId)}`;
}

interface UseMatchesFeedParams {
  tab: StatusTab;
  searchQuery: string;
  sourceParam: string;
  sort: SortKey;
  page: number;
  loops: readonly Loop[];
}

export interface MatchesFeed {
  items: MatchWithLoopName[];
  counts: MatchesFeedCounts;
  total: number;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  activeMatchId: string | null;
  activeItem: MatchWithLoopName | null;
  convertingId: string | null;
  savingId: string | null;
  totalPages: number;
  safePage: number;
  sourceBuckets: SourceBucket[];
  nextRunAt: string | null;
  handleSelect: (matchId: string) => void;
  handleOpenDetails: (match: VacancyMatch) => void;
  handleConvert: (match: VacancyMatch) => Promise<void>;
  handleSave: (match: VacancyMatch) => Promise<void>;
  handleRefresh: () => Promise<void>;
  triggerReload: () => void;
}

/**
 * Owns the persisted Matches feed: the backend does the filtering (tab/source/
 * search), sorting, tab counts and pagination, so this hook just fetches the
 * current page and renders it. Selection, seen-tracking, "Создать заявку",
 * "Сохранить" and on-demand "Обновить" (real discovery pass) live here too. The
 * backend remains the single source of truth — no client-side score/filter.
 */
export function useMatchesFeed({
  tab,
  searchQuery,
  sourceParam,
  sort,
  page,
  loops,
}: UseMatchesFeedParams): MatchesFeed {
  const navigate = useNavigate();

  const [items, setItems] = useState<MatchWithLoopName[]>([]);
  const [counts, setCounts] = useState<MatchesFeedCounts>({ all: 0, new: 0, saved: 0 });
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const totalPages = Math.max(1, Math.ceil(total / MATCHES_V2_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);

  const fetchFeed = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (Math.max(page, 1) - 1) * MATCHES_V2_PAGE_SIZE;
      const result = await listMatchesFeedViaRest({
        tab,
        q: searchQuery || null,
        source: sourceParam || null,
        sort,
        limit: MATCHES_V2_PAGE_SIZE,
        offset,
      });
      setItems(result.items.map((entry) => ({ match: entry.match, loopName: entry.loopName ?? "" })));
      setCounts(result.counts);
      setTotal(result.total);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
      setItems([]);
      setCounts({ all: 0, new: 0, saved: 0 });
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [tab, searchQuery, sourceParam, sort, page]);

  // `reloadKey` bumps (Обновить / auto-refresh) re-run the fetch without being a
  // fetch input, so it lives on the effect rather than in fetchFeed's deps.
  useEffect(() => {
    void fetchFeed();
  }, [fetchFeed, reloadKey]);

  // Keep a valid selection: clear it when the page is empty, otherwise default to
  // the first row. Selecting here (vs. a click) must NOT mark the row seen.
  useEffect(() => {
    if (items.length === 0) {
      setActiveMatchId(null);
      return;
    }
    const exists = items.some((entry) => entry.match.id === activeMatchId);
    if (!exists) setActiveMatchId(items[0]?.match.id ?? null);
  }, [items, activeMatchId]);

  const activeItem = items.find((entry) => entry.match.id === activeMatchId) ?? null;
  const sourceBuckets = useMemo(() => buildSourceBuckets(loops), [loops]);

  // Soonest upcoming scheduled run across the visible loops — drives the live
  // "автообновление через …" countdown; when it elapses we re-read the feed.
  const nextRunAt = useMemo(() => {
    const now = Date.now();
    let soonest: number | null = null;
    for (const loop of loops) {
      if (!loop.nextRunAt) continue;
      const ts = Date.parse(loop.nextRunAt);
      if (Number.isNaN(ts) || ts <= now) continue;
      if (soonest === null || ts < soonest) soonest = ts;
    }
    return soonest === null ? null : new Date(soonest).toISOString();
  }, [loops]);

  const triggerReload = useCallback(() => {
    setReloadKey((key) => key + 1);
  }, []);

  // Mark a match seen the moment the user opens it (card click / Подробнее / link).
  // Idempotent + non-fatal: a failure must not block reading the vacancy.
  const markSeen = useCallback(async (match: VacancyMatch) => {
    try {
      const updated = await markLoopVacancyMatchSeenViaRest(match.loopId, match.id);
      setItems((current) =>
        current.map((entry) =>
          entry.match.id === match.id ? { ...entry, match: updated } : entry,
        ),
      );
    } catch {
      /* seen-tracking is best-effort */
    }
  }, []);

  const handleSelect = useCallback(
    (matchId: string) => {
      setActiveMatchId(matchId);
      const item = items.find((entry) => entry.match.id === matchId);
      if (item && !item.match.seenAt) void markSeen(item.match);
    },
    [items, markSeen],
  );

  const handleOpenDetails = useCallback(
    (match: VacancyMatch) => {
      if (!match.seenAt) void markSeen(match);
      navigate(buildMatchDetailsRoute(match));
    },
    [markSeen, navigate],
  );

  // "Создать заявку" — explicit, per-click conversion of a match into an application.
  const handleConvert = useCallback(async (match: VacancyMatch) => {
    setConvertingId(match.id);
    setError(null);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(match.loopId, match.id);
      setItems((current) =>
        current.map((entry) =>
          entry.match.id === match.id ? { ...entry, match: result.match } : entry,
        ),
      );
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConvertingId(null);
    }
  }, []);

  // "Сохранить" — bookmark a new match so it moves into the «Сохранённые» tab.
  const handleSave = useCallback(async (match: VacancyMatch) => {
    setSavingId(match.id);
    setError(null);
    try {
      const updated = await patchLoopVacancyMatchViaRest(match.loopId, match.id, {
        status: "saved",
      });
      setItems((current) =>
        current.map((entry) =>
          entry.match.id === match.id ? { ...entry, match: updated } : entry,
        ),
      );
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  }, []);

  // "Обновить" = on-demand "добор": run a real discovery pass for every visible
  // loop so freshly-found vacancies get persisted, then re-read the feed. Each
  // loop runs best-effort so one source failing can't block the rest.
  const handleRefresh = useCallback(async () => {
    if (loops.length === 0) {
      triggerReload();
      return;
    }
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all(
        loops.map((loop) => runDiscoveryViaRest({ loopId: loop.id }).catch(() => null)),
      );
    } catch (refreshError: unknown) {
      setError(getErrorMessage(refreshError));
    } finally {
      setIsRefreshing(false);
      triggerReload();
    }
  }, [loops, triggerReload]);

  return {
    items,
    counts,
    total,
    isLoading,
    isRefreshing,
    error,
    activeMatchId,
    activeItem,
    convertingId,
    savingId,
    totalPages,
    safePage,
    sourceBuckets,
    nextRunAt,
    handleSelect,
    handleOpenDetails,
    handleConvert,
    handleSave,
    handleRefresh,
    triggerReload,
  };
}
