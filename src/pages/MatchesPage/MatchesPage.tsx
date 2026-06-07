import { ArrowLeft, Check, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { runDiscoveryPreviewViaRest } from "src/features/discoveryRuns";
import { useBackendLoopsQuery } from "src/features/loops";
import {
  getCurrentUserProfileViaRest,
  markMatchesSeenViaRest,
} from "src/features/userProfile";
import {
  createApplicationFromVacancyMatchViaRest,
  ignoreDiscoveryPreviewViaRest,
  listLoopVacancyMatchesViaRest,
  patchLoopVacancyMatchViaRest,
  saveDiscoveryPreviewAsApplicationViaRest,
  saveDiscoveryPreviewAsMatchViaRest,
  type SaveDiscoveryPreviewMatchInput,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import { MatchesDetailPanel } from "./components/MatchesDetailPanel";
import { MatchesListPanel } from "./components/MatchesListPanel";
import { MatchesSourcesStrip } from "./components/MatchesSourcesStrip";
import {
  MATCHES_V2_PAGE_SIZE,
  MATCHES_V2_PER_LOOP_FETCH_CAP,
  buildLoopMetaLine,
  buildMergedMatchesFeed,
  countMatchesByStatus,
  filterMatches,
  getLoopDisplayName,
  getLoopSyncState,
  getSourceBuckets,
  isMatchUnseen,
  sortMatches,
  SORT_OPTIONS,
  STATUS_TAB_LABELS,
  type MatchPreviewOrigin,
  type MatchWithLoopName,
  type SortKey,
  type StatusTab,
} from "./components/matchesV2.helpers";

// When the backend preview cache is cold it warms in the background and returns
// `cache_warming`; poll a few times so the live feed fills in without a manual
// refresh (mirrors DiscoveryPreviewFeed on the loop-detail page).
const MAX_WARM_RETRIES = 4;
const WARM_RETRY_DELAY_MS = 4000;

/** Shape the raw discovery item into the save/convert preview payload. */
function previewToSaveInput(origin: MatchPreviewOrigin): SaveDiscoveryPreviewMatchInput {
  const { sourceId, item } = origin;
  return {
    sourceId,
    externalId: item.externalId,
    sourceUrl: item.sourceUrl,
    title: item.title,
    company: item.company,
    location: item.location,
    description: item.snippet,
    postedAt: item.postedAt,
    rawMetadata: item.rawMetadata,
    confidence: item.confidence,
  };
}

type LoopsQueryData = Loop[] | { items?: Loop[] } | undefined;

function readLoopsFromQuery(data: LoopsQueryData): Loop[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function buildMatchDetailsRoute(match: VacancyMatch): string {
  return `/dashboard/matches/${encodeURIComponent(match.id)}?loopId=${encodeURIComponent(match.loopId)}`;
}

function parsePageParam(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const STATUS_TAB_ORDER: StatusTab[] = ["all", "new", "saved", "converted", "ignored"];

function buildSubtitle(selectedLoop: Loop | null, loopsCount: number): string {
  if (selectedLoop) return `Вакансии из цикла «${getLoopDisplayName(selectedLoop)}»`;
  if (loopsCount > 1) return `Объединённый список из ${loopsCount} циклов поиска`;
  return "Сохранённые вакансии из всех циклов поиска";
}

function HeaderStatusBadge({
  selectedLoop,
  isLoadingLoops,
  count,
}: {
  selectedLoop: Loop | null;
  isLoadingLoops: boolean;
  count: number;
}) {
  if (isLoadingLoops) return null;
  if (selectedLoop) {
    const sync = getLoopSyncState(selectedLoop);
    const tone = sync.isActive
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"
      : "bg-muted text-muted-foreground";
    return (
      <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${tone}`}>
        ● {sync.label}
      </span>
    );
  }
  return (
    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
      ● {count} вакансий
    </span>
  );
}

function MatchesEmptyState({ kind }: { kind: "loops-loading" | "no-loops" }) {
  if (kind === "loops-loading") {
    return (
      <div className="rounded-[14px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
        Загружаем циклы…
      </div>
    );
  }
  return (
    <div className="rounded-[14px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
      Создайте цикл поиска, чтобы видеть здесь матчи.
    </div>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const loopsQ = useBackendLoopsQuery({ includeArchived: false });
  const loops = useMemo(
    () => readLoopsFromQuery(loopsQ.data as LoopsQueryData).filter((loop) => loop.status !== "archived"),
    [loopsQ.data],
  );

  const selectedLoopId = searchParams.get("loopId") ?? "";
  const sortParam = (searchParams.get("sort") as SortKey | null) ?? "posted";
  const statusParam = (searchParams.get("status") as StatusTab | null) ?? "all";
  const sourceParam = searchParams.get("source") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const page = parsePageParam(searchParams.get("page"));

  const [items, setItems] = useState<MatchWithLoopName[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isWarming, setIsWarming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [activeMatchId, setActiveMatchId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  // Server watermark for the «Новые» (unseen) tab. Null = never marked seen, so
  // every match counts as new until the user clicks «Отметить просмотренными».
  const [matchesSeenAt, setMatchesSeenAt] = useState<string | null>(null);
  const [isMarkingSeen, setIsMarkingSeen] = useState(false);

  const warmRetriesRef = useRef(0);
  const warmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fetchMatchesRef = useRef<() => void>(() => {});

  const targetLoops = useMemo(() => {
    if (selectedLoopId) {
      const loop = loops.find((entry) => entry.id === selectedLoopId);
      return loop ? [loop] : [];
    }
    return loops;
  }, [loops, selectedLoopId]);

  const updateParam = useCallback(
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams);
      for (const [key, value] of Object.entries(patch)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  // Builds the unified feed: persisted matches (the source of truth) plus a
  // live discovery "добор" so the list shows the full set of vacancies found
  // for each loop — not just the handful already saved. The backend already
  // drops saved/handled items from the preview (_filter_already_handled), so
  // the two streams don't double-count; we still dedupe defensively by
  // (source, externalId|url) in case a freshly-saved match is still cached.
  const fetchMatches = useCallback(async () => {
    if (targetLoops.length === 0) {
      setItems([]);
      return;
    }
    if (warmTimerRef.current) {
      clearTimeout(warmTimerRef.current);
      warmTimerRef.current = null;
    }
    setIsLoading(true);
    setError(null);
    try {
      const [dbResults, previewResults] = await Promise.all([
        Promise.all(
          targetLoops.map((loop) =>
            listLoopVacancyMatchesViaRest(loop.id, {
              limit: MATCHES_V2_PER_LOOP_FETCH_CAP,
              offset: 0,
            }).then((response) => ({ loop, response })),
          ),
        ),
        Promise.all(
          targetLoops.map((loop) =>
            runDiscoveryPreviewViaRest({
              loopId: loop.id,
              dryRun: true,
              page: 1,
              pageSize: MATCHES_V2_PAGE_SIZE,
              cacheOnly: true,
            })
              .then((response) => ({ loop, response }))
              // A live-preview failure must not blank out the saved matches.
              .catch(() => ({ loop, response: null })),
          ),
        ),
      ]);

      const { items: merged, warmingCount } = buildMergedMatchesFeed(
        dbResults,
        previewResults,
      );

      setItems(merged);

      // Some sources are still warming server-side — poll a few times so the
      // live "добор" fills in once the background fetch lands.
      if (warmingCount > 0 && warmRetriesRef.current < MAX_WARM_RETRIES) {
        warmRetriesRef.current += 1;
        setIsWarming(true);
        warmTimerRef.current = setTimeout(() => {
          fetchMatchesRef.current();
        }, WARM_RETRY_DELAY_MS);
      } else {
        setIsWarming(false);
        warmRetriesRef.current = 0;
      }
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
      setItems([]);
      setIsWarming(false);
    } finally {
      setIsLoading(false);
    }
  }, [targetLoops]);

  // Keep a stable ref to the latest fetchMatches so warm-retry timers always
  // invoke the current closure (correct loops/filters) without re-subscribing.
  useEffect(() => {
    fetchMatchesRef.current = () => {
      void fetchMatches();
    };
  }, [fetchMatches]);

  // A new loop selection restarts the warm-retry budget from scratch.
  useEffect(() => {
    warmRetriesRef.current = 0;
  }, [targetLoops]);

  // Clear any pending warm-retry timer on unmount.
  useEffect(() => {
    return () => {
      if (warmTimerRef.current) clearTimeout(warmTimerRef.current);
    };
  }, []);

  useEffect(() => {
    void fetchMatches();
  }, [fetchMatches, reloadKey]);

  // Load the user's "seen" watermark once so the «Новые» tab can mean "unseen".
  // A profile-load failure is non-fatal: we leave the watermark null, which
  // treats everything as new rather than silently hiding matches.
  useEffect(() => {
    let cancelled = false;
    getCurrentUserProfileViaRest()
      .then((profile) => {
        if (!cancelled) setMatchesSeenAt(profile.matchesSeenAt);
      })
      .catch(() => {
        /* keep watermark null on failure */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const totalUnseen = useMemo(
    () => items.reduce((sum, item) => (isMatchUnseen(item, matchesSeenAt) ? sum + 1 : sum), 0),
    [items, matchesSeenAt],
  );

  const sourceBuckets = useMemo(
    () =>
      getSourceBuckets(
        filterMatches(items, {
          q: searchQuery,
          source: "",
          status: statusParam,
          loopId: "",
          watermark: matchesSeenAt,
        }),
      ),
    [items, searchQuery, statusParam, matchesSeenAt],
  );

  const statusCounts = useMemo(
    () =>
      countMatchesByStatus(
        filterMatches(items, {
          q: searchQuery,
          source: sourceParam,
          status: "all",
          loopId: "",
          watermark: matchesSeenAt,
        }),
        matchesSeenAt,
      ),
    [items, searchQuery, sourceParam, matchesSeenAt],
  );

  const filteredAndSorted = useMemo(
    () =>
      sortMatches(
        filterMatches(items, {
          q: searchQuery,
          source: sourceParam,
          status: statusParam,
          loopId: "",
          watermark: matchesSeenAt,
        }),
        sortParam,
      ),
    [items, searchQuery, sourceParam, statusParam, sortParam, matchesSeenAt],
  );

  const totalFiltered = filteredAndSorted.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / MATCHES_V2_PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () =>
      filteredAndSorted.slice(
        (safePage - 1) * MATCHES_V2_PAGE_SIZE,
        safePage * MATCHES_V2_PAGE_SIZE,
      ),
    [filteredAndSorted, safePage],
  );

  useEffect(() => {
    if (pagedItems.length === 0) {
      setActiveMatchId(null);
      return;
    }
    const existing = pagedItems.find((item) => item.match.id === activeMatchId);
    if (!existing) setActiveMatchId(pagedItems[0]?.match.id ?? null);
  }, [pagedItems, activeMatchId]);

  useEffect(() => {
    if (page !== safePage && totalFiltered >= 0) {
      updateParam({ page: safePage === 1 ? null : String(safePage) });
    }
  }, [page, safePage, totalFiltered, updateParam]);

  const activeItem = pagedItems.find((item) => item.match.id === activeMatchId) ?? null;

  const fromLoopId = searchParams.get("loopId");
  const selectedLoop = selectedLoopId
    ? (loops.find((loop) => loop.id === selectedLoopId) ?? null)
    : null;

  const headerTitle = selectedLoop ? `Матчи · ${getLoopDisplayName(selectedLoop)}` : "Матчи";

  function handleSelectLoop(loopId: string) {
    updateParam({ loopId: loopId || null, page: null });
  }

  function handleStatusChange(next: StatusTab) {
    updateParam({ status: next === "all" ? null : next, page: null });
  }

  function handleSourceChange(next: string) {
    updateParam({ source: next || null, page: null });
  }

  function handleSortChange(next: SortKey) {
    updateParam({ sort: next === "posted" ? null : next });
  }

  function handleSearchChange(value: string) {
    updateParam({ q: value || null, page: null });
  }

  function handlePageChange(next: number) {
    updateParam({ page: next === 1 ? null : String(next) });
  }

  const triggerReload = useCallback(() => {
    warmRetriesRef.current = 0;
    setReloadKey((key) => key + 1);
  }, []);

  // Advance the server watermark to now so every currently-visible match counts
  // as "seen"; the «Новые» tab then only fills as fresh vacancies arrive.
  const handleMarkSeen = useCallback(async () => {
    setIsMarkingSeen(true);
    setError(null);
    try {
      const profile = await markMatchesSeenViaRest();
      setMatchesSeenAt(profile.matchesSeenAt);
    } catch (markError: unknown) {
      setError(getErrorMessage(markError));
    } finally {
      setIsMarkingSeen(false);
    }
  }, []);

  function findItem(matchId: string): MatchWithLoopName | null {
    return items.find((item) => item.match.id === matchId) ?? null;
  }

  // Preview rows have no persisted match id yet, so "Создать заявку" saves the
  // live item straight into an application; persisted matches use the normal
  // match→application endpoint.
  async function handleConvert(match: VacancyMatch) {
    const current = findItem(match.id);
    setConvertingId(match.id);
    setError(null);
    try {
      if (current?.isPreview && current.preview) {
        await saveDiscoveryPreviewAsApplicationViaRest(
          match.loopId,
          previewToSaveInput(current.preview),
        );
        triggerReload();
      } else {
        const result = await createApplicationFromVacancyMatchViaRest(match.loopId, match.id);
        setItems((current) =>
          current.map((item) =>
            item.match.id === match.id ? { ...item, match: result.match } : item,
          ),
        );
      }
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConvertingId(null);
    }
  }

  // Persist a live preview row as a saved match so it survives the next refresh.
  async function handleSave(match: VacancyMatch) {
    const current = findItem(match.id);
    if (!current?.isPreview || !current.preview) return;
    setSavingId(match.id);
    setError(null);
    try {
      await saveDiscoveryPreviewAsMatchViaRest(
        match.loopId,
        previewToSaveInput(current.preview),
      );
      triggerReload();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError));
    } finally {
      setSavingId(null);
    }
  }

  // Hiding a preview row records a preview-ignore (so it stays filtered out);
  // hiding a persisted match flips its status to "ignored".
  async function handleIgnore(match: VacancyMatch) {
    const current = findItem(match.id);
    setIgnoringId(match.id);
    setError(null);
    try {
      if (current?.isPreview && current.preview) {
        const { sourceId, item } = current.preview;
        await ignoreDiscoveryPreviewViaRest(match.loopId, {
          sourceId,
          externalId: item.externalId,
          sourceUrl: item.sourceUrl,
          title: item.title,
          company: item.company,
        });
        setItems((current) => current.filter((entry) => entry.match.id !== match.id));
      } else {
        const updated = await patchLoopVacancyMatchViaRest(match.loopId, match.id, {
          status: "ignored",
        });
        setItems((current) =>
          current.map((item) =>
            item.match.id === match.id ? { ...item, match: updated } : item,
          ),
        );
      }
    } catch (ignoreError: unknown) {
      setError(getErrorMessage(ignoreError));
    } finally {
      setIgnoringId(null);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border bg-background px-7 pb-3 pt-4">
        <div className="mb-2 flex items-center gap-1.5 text-[11.5px] text-muted-foreground">
          {fromLoopId ? (
            <button
              type="button"
              onClick={() => navigate(`/dashboard/loops/${fromLoopId}`)}
              className="inline-flex items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Назад к циклу
            </button>
          ) : (
            <>
              <span>Loopboard</span>
              <span>/</span>
              <span>Матчи</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
                {headerTitle}
              </h1>
              <HeaderStatusBadge
                selectedLoop={selectedLoop}
                isLoadingLoops={loopsQ.isLoading}
                count={items.length}
              />
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {selectedLoop
                ? buildLoopMetaLine(selectedLoop, items.length)
                : buildSubtitle(selectedLoop, loops.length)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {loops.length > 1 ? (
              <select
                value={selectedLoopId}
                onChange={(event) => handleSelectLoop(event.target.value)}
                disabled={loopsQ.isLoading}
                className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px] text-foreground"
              >
                <option value="">Все циклы</option>
                {loops.map((loop) => (
                  <option key={loop.id} value={loop.id}>
                    {getLoopDisplayName(loop)}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={triggerReload}
              disabled={targetLoops.length === 0 || isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isWarming ? "animate-spin" : ""}`} />
              Обновить
            </button>
          </div>
        </div>
      </header>

      <MatchesSourcesStrip
        buckets={sourceBuckets}
        totalCount={sourceBuckets.reduce((sum, bucket) => sum + bucket.count, 0)}
        activeSource={sourceParam}
        onChange={handleSourceChange}
      />

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border bg-background px-7 pt-2.5">
        <div className="-mb-px flex flex-wrap gap-0.5">
          {STATUS_TAB_ORDER.map((tab) => {
            const isActive = statusParam === tab;
            return (
              <button
                key={tab}
                type="button"
                onClick={() => handleStatusChange(tab)}
                className={[
                  "inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-[12.5px] transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {STATUS_TAB_LABELS[tab]}
                <span className="rounded-full border border-border bg-muted px-1.5 text-[10.5px] text-muted-foreground tabular-nums">
                  {statusCounts[tab]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pb-1.5">
          <button
            type="button"
            onClick={() => void handleMarkSeen()}
            disabled={isMarkingSeen || totalUnseen === 0}
            title="Отметить все вакансии как просмотренные"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <Check className="h-3.5 w-3.5" />
            Отметить просмотренными
          </button>
          <input
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Роль, компания…"
            className="h-8 w-44 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <span className="text-[11px] text-muted-foreground">Сортировка:</span>
          <select
            value={sortParam}
            onChange={(event) => handleSortChange(event.target.value as SortKey)}
            className="h-8 rounded-md border border-border bg-background px-2 text-[12px] text-foreground"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <MatchesMainArea
        isLoadingLoops={loopsQ.isLoading}
        loopsCount={loops.length}
        error={error}
        listItems={pagedItems}
        totalItems={items.length}
        activeMatchId={activeMatchId}
        setActiveMatchId={setActiveMatchId}
        isLoading={isLoading}
        isWarming={isWarming}
        page={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        activeItem={activeItem}
        convertingId={convertingId}
        ignoringId={ignoringId}
        savingId={savingId}
        nextRunAt={selectedLoop?.nextRunAt ?? null}
        onAutoRefresh={triggerReload}
        onConvert={(match) => {
          void handleConvert(match);
        }}
        onSave={(match) => {
          void handleSave(match);
        }}
        onIgnore={(match) => {
          void handleIgnore(match);
        }}
        onOpenDetails={(match) => navigate(buildMatchDetailsRoute(match))}
      />
    </div>
  );
}

interface MatchesMainAreaProps {
  isLoadingLoops: boolean;
  loopsCount: number;
  error: string | null;
  listItems: readonly MatchWithLoopName[];
  totalItems: number;
  activeMatchId: string | null;
  setActiveMatchId: (id: string) => void;
  isLoading: boolean;
  isWarming: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  activeItem: MatchWithLoopName | null;
  convertingId: string | null;
  ignoringId: string | null;
  savingId: string | null;
  nextRunAt: string | null;
  onAutoRefresh: () => void;
  onConvert: (match: VacancyMatch) => void;
  onSave: (match: VacancyMatch) => void;
  onIgnore: (match: VacancyMatch) => void;
  onOpenDetails: (match: VacancyMatch) => void;
}

function MatchesMainArea(props: MatchesMainAreaProps) {
  if (props.isLoadingLoops) {
    return (
      <main className="min-h-0 flex-1 overflow-hidden px-7 py-4">
        <MatchesEmptyState kind="loops-loading" />
      </main>
    );
  }
  if (props.loopsCount === 0) {
    return (
      <main className="min-h-0 flex-1 overflow-hidden px-7 py-4">
        <MatchesEmptyState kind="no-loops" />
      </main>
    );
  }
  const {
    error,
    listItems,
    totalItems,
    activeMatchId,
    setActiveMatchId,
    isLoading,
    isWarming,
    page,
    totalPages,
    onPageChange,
    activeItem,
    convertingId,
    ignoringId,
    savingId,
    nextRunAt,
    onAutoRefresh,
    onConvert,
    onSave,
    onIgnore,
    onOpenDetails,
  } = props;
  return (
    <main className="min-h-0 flex-1 overflow-hidden px-7 py-4">
      {error ? (
        <div className="mb-3 rounded-[10px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {error}
        </div>
      ) : null}
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <MatchesListPanel
          items={listItems}
          totalCount={totalItems}
          activeMatchId={activeMatchId}
          onSelect={setActiveMatchId}
          isLoading={isLoading}
          isWarming={isWarming}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          nextRunAt={nextRunAt}
          onAutoRefresh={onAutoRefresh}
        />
        <MatchesDetailPanel
          item={activeItem}
          isConverting={activeItem ? convertingId === activeItem.match.id : false}
          isIgnoring={activeItem ? ignoringId === activeItem.match.id : false}
          isSaving={activeItem ? savingId === activeItem.match.id : false}
          onConvert={onConvert}
          onSave={onSave}
          onIgnore={onIgnore}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </main>
  );
}
