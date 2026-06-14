import { ArrowLeft, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { runDiscoveryViaRest } from "src/features/discoveryRuns";
import { useBackendLoopsQuery } from "src/features/loops";
import {
  createApplicationFromVacancyMatchViaRest,
  listMatchesFeedViaRest,
  markLoopVacancyMatchSeenViaRest,
  patchLoopVacancyMatchViaRest,
  type MatchesFeedCounts,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import { MatchesDetailPanel } from "./components/MatchesDetailPanel";
import { MatchesListPanel } from "./components/MatchesListPanel";
import { MatchesSourcesStrip } from "./components/MatchesSourcesStrip";
import {
  MATCHES_V2_PAGE_SIZE,
  buildSourceBuckets,
  isLoopVisibleInMatches,
  SORT_OPTIONS,
  STATUS_TAB_LABELS,
  type MatchWithLoopName,
  type SortKey,
  type StatusTab,
} from "./components/matchesV2.helpers";

type LoopsQueryData = Loop[] | { items?: Loop[] } | undefined;

function readLoopsFromQuery(data: LoopsQueryData): Loop[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

// The loopId param is carried only so we can render a "Назад к циклу" crumb when
// the user arrived from a loop page. It is NOT a feed filter — the Matches list
// is always the unified cross-loop feed (fixes the "only one loop shows" bug).
function buildMatchDetailsRoute(match: VacancyMatch): string {
  return `/dashboard/matches/${encodeURIComponent(match.id)}?loopId=${encodeURIComponent(match.loopId)}`;
}

function parsePageParam(raw: string | null): number {
  const parsed = Number.parseInt(raw ?? "1", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

const STATUS_TAB_ORDER: StatusTab[] = ["all", "new", "saved"];
const VALID_TABS = new Set<StatusTab>(STATUS_TAB_ORDER);
const VALID_SORTS = new Set<SortKey>(SORT_OPTIONS.map((option) => option.value));

function parseTab(raw: string | null): StatusTab {
  return raw && VALID_TABS.has(raw as StatusTab) ? (raw as StatusTab) : "all";
}

function parseSort(raw: string | null): SortKey {
  return raw && VALID_SORTS.has(raw as SortKey) ? (raw as SortKey) : "posted";
}

function buildSubtitle(loopsCount: number): string {
  if (loopsCount > 1) return `Объединённый список из ${loopsCount} циклов поиска`;
  return "Сохранённые вакансии из всех циклов поиска";
}

function HeaderStatusBadge({
  isLoadingLoops,
  count,
}: {
  isLoadingLoops: boolean;
  count: number;
}) {
  if (isLoadingLoops) return null;
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
  // Only active loops feed the Matches list. Paused or archived loops are hidden
  // outright (no rows, not selectable) until the user resumes them.
  const loops = useMemo(
    () => readLoopsFromQuery(loopsQ.data as LoopsQueryData).filter(isLoopVisibleInMatches),
    [loopsQ.data],
  );

  const fromLoopId = searchParams.get("loopId");
  const tab = parseTab(searchParams.get("status"));
  const sort = parseSort(searchParams.get("sort"));
  const sourceParam = searchParams.get("source") ?? "";
  const searchQuery = searchParams.get("q") ?? "";
  const page = parsePageParam(searchParams.get("page"));

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

  // The persisted matches feed is the single source of truth: the backend does
  // the filtering (tab/source/search), freshness/company/loop sorting, the tab
  // counts, and pagination, so the page just renders whatever page it returns.
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

  // Snap an out-of-range page back into bounds once the total is known.
  useEffect(() => {
    if (page > totalPages) {
      updateParam({ page: totalPages === 1 ? null : String(totalPages) });
    }
  }, [page, totalPages, updateParam]);

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

  const headerTitle = "Матчи";

  function handleStatusChange(next: StatusTab) {
    updateParam({ status: next === "all" ? null : next, page: null });
  }

  function handleSourceChange(next: string) {
    updateParam({ source: next || null, page: null });
  }

  function handleSortChange(next: SortKey) {
    updateParam({ sort: next === "posted" ? null : next, page: null });
  }

  function handleSearchChange(value: string) {
    updateParam({ q: value || null, page: null });
  }

  function handlePageChange(next: number) {
    updateParam({ page: next === 1 ? null : String(next) });
  }

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
  async function handleConvert(match: VacancyMatch) {
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
  }

  // "Сохранить" — bookmark a new match so it moves into the «Сохранённые» tab.
  async function handleSave(match: VacancyMatch) {
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
  }

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
              <HeaderStatusBadge isLoadingLoops={loopsQ.isLoading} count={counts.all} />
            </div>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {buildSubtitle(loops.length)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void handleRefresh()}
              disabled={loops.length === 0 || isLoading || isRefreshing}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading || isRefreshing ? "animate-spin" : ""}`} />
              {isRefreshing ? "Обновляем…" : "Обновить"}
            </button>
          </div>
        </div>
      </header>

      <MatchesSourcesStrip
        buckets={sourceBuckets}
        totalCount={counts.all}
        activeSource={sourceParam}
        onChange={handleSourceChange}
      />

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border bg-background px-7 pt-2.5">
        <div className="-mb-px flex flex-wrap gap-0.5">
          {STATUS_TAB_ORDER.map((entry) => {
            const isActive = tab === entry;
            return (
              <button
                key={entry}
                type="button"
                onClick={() => handleStatusChange(entry)}
                className={[
                  "inline-flex items-center gap-1.5 border-b-2 px-3.5 py-2 text-[12.5px] transition-colors",
                  isActive
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {STATUS_TAB_LABELS[entry]}
                <span className="rounded-full border border-border bg-muted px-1.5 text-[10.5px] text-muted-foreground tabular-nums">
                  {counts[entry]}
                </span>
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 pb-1.5">
          <input
            value={searchQuery}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Роль, компания…"
            className="h-8 w-44 rounded-md border border-border bg-background px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
          />
          <span className="text-[11px] text-muted-foreground">Сортировка:</span>
          <select
            value={sort}
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
        listItems={items}
        totalItems={total}
        activeMatchId={activeMatchId}
        onSelect={handleSelect}
        isLoading={isLoading}
        page={safePage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        activeItem={activeItem}
        convertingId={convertingId}
        savingId={savingId}
        nextRunAt={nextRunAt}
        onAutoRefresh={triggerReload}
        onConvert={(match) => {
          void handleConvert(match);
        }}
        onSave={(match) => {
          void handleSave(match);
        }}
        onOpenDetails={handleOpenDetails}
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
  onSelect: (id: string) => void;
  isLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number) => void;
  activeItem: MatchWithLoopName | null;
  convertingId: string | null;
  savingId: string | null;
  nextRunAt: string | null;
  onAutoRefresh: () => void;
  onConvert: (match: VacancyMatch) => void;
  onSave: (match: VacancyMatch) => void;
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
    onSelect,
    isLoading,
    page,
    totalPages,
    onPageChange,
    activeItem,
    convertingId,
    savingId,
    nextRunAt,
    onAutoRefresh,
    onConvert,
    onSave,
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
          onSelect={onSelect}
          isLoading={isLoading}
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          nextRunAt={nextRunAt}
          onAutoRefresh={onAutoRefresh}
        />
        <MatchesDetailPanel
          item={activeItem}
          isConverting={activeItem ? convertingId === activeItem.match.id : false}
          isSaving={activeItem ? savingId === activeItem.match.id : false}
          onConvert={onConvert}
          onSave={onSave}
          onOpenDetails={onOpenDetails}
        />
      </div>
    </main>
  );
}
