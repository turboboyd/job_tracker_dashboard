import { useEffect, useMemo, useRef, useState } from "react";

import {
  runDiscoveryPreviewViaRest,
  type DiscoveryRunPreviewItem,
} from "src/features/discoveryRuns";
import {
  getDiscoveryPreviewSaveButtonLabel,
  getDiscoveryPreviewSaveErrorMessage,
  isDiscoveryPreviewSaveDisabled,
  type DiscoveryPreviewSaveState,
} from "src/features/discoveryRuns/ui/discoveryPreview.helpers";
import { saveDiscoveryPreviewAsMatchViaRest } from "src/features/vacancyMatches";
import { Button } from "src/shared/ui";

// Backend caps page_size at MAX_RESULTS_PER_SOURCE (20) and rejects larger
// values with 422 (DiscoveryRunRequest uses extra="forbid", page_size le=20).
// Must stay <= 20 — pagination ("Показать ещё") fetches further pages.
const PAGE_SIZE = 20;

// When the backend cache is cold it warms in the background; auto-retry a few
// times so the feed fills in without the user having to hit "Обновить".
const MAX_WARM_RETRIES = 4;
const WARM_RETRY_DELAY_MS = 4000;

export interface FeedSource {
  sourceId: string;
  label: string;
}

interface FeedItem extends DiscoveryRunPreviewItem {
  _sourceId: string;
  _sourceLabel: string;
}

interface SourceState {
  page: number;
  hasMore: boolean;
}

interface FetchPageResult {
  sourceId: string;
  items: FeedItem[];
  hasMore: boolean;
  errored: boolean;
  /** Backend cache was cold and a background refresh was requested. */
  warming: boolean;
}

export interface DiscoveryPreviewFeedProps {
  loopId: string;
  sources: FeedSource[];
  onMatchSaved?: () => void;
  onRunComplete?: () => void;
}

function getItemKey(item: FeedItem): string {
  return `${item._sourceId}:${item.externalId ?? item.sourceUrl}`;
}

function formatPostedAt(postedAt: string | null): string | null {
  if (!postedAt) return null;
  const ts = Date.parse(postedAt);
  if (!Number.isFinite(ts)) return null;
  // Show the actual publication date (DD.MM.YYYY) rather than a relative
  // "N недель назад" — easier to judge how stale a posting really is.
  const d = new Date(ts);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

function stripHtml(value: string | null | undefined): string {
  if (!value) return "";
  const decoded = value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
  return decoded.replace(/\s+/g, " ").trim();
}

function FeedCard({
  item,
  saveState,
  saveError,
  onSave,
}: {
  item: FeedItem;
  saveState: DiscoveryPreviewSaveState;
  saveError: string | null;
  onSave: () => void;
}) {
  const postedAt = formatPostedAt(item.postedAt);

  return (
    <div className="rounded-[12px] border border-border bg-background p-4 transition-colors hover:border-muted-foreground/40">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          {item._sourceLabel}
        </span>
        {item.confidence.source_quality !== undefined ? (
          <span className="shrink-0 text-[11px] text-muted-foreground">
            Качество {Math.round(item.confidence.source_quality * 100)}%
          </span>
        ) : null}
      </div>
      <a
        href={item.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="text-[14px] font-semibold text-foreground hover:underline"
      >
        {item.title || "Вакансия без названия"}
      </a>
      <div className="mt-0.5 text-[12.5px] text-muted-foreground">
        {item.company || "Компания не указана"}
        {item.location ? ` · ${item.location}` : ""}
        {postedAt ? ` · опубл. ${postedAt}` : ""}
      </div>
      {item.snippet ? (
        <p className="mt-2 line-clamp-2 text-[12.5px] text-muted-foreground">
          {stripHtml(item.snippet)}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          Открыть вакансию
        </a>
        <Button size="sm" onClick={onSave} disabled={isDiscoveryPreviewSaveDisabled(saveState)}>
          {getDiscoveryPreviewSaveButtonLabel(saveState)}
        </Button>
      </div>
      {saveError ? (
        <div className="mt-2 text-[12px] text-destructive">{saveError}</div>
      ) : null}
    </div>
  );
}

export function DiscoveryPreviewFeed({
  loopId,
  sources,
  onMatchSaved,
  onRunComplete,
}: DiscoveryPreviewFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [sourceStates, setSourceStates] = useState<Record<string, SourceState>>({});
  const [isLoadingFirst, setIsLoadingFirst] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, DiscoveryPreviewSaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string | null>>({});
  const [isWarming, setIsWarming] = useState(false);
  const didAutoRun = useRef(false);
  const warmRetriesRef = useRef(0);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const moreRetriesRef = useRef(0);
  const moreRetryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Mirror of sourceStates so loadMore (incl. its setTimeout retries) always
  // reads the latest paging state instead of a stale render closure.
  const sourceStatesRef = useRef<Record<string, SourceState>>({});

  const labelMap = useMemo(
    () => new Map(sources.map(({ sourceId, label }) => [sourceId, label])),
    [sources],
  );

  async function fetchPage(sourceId: string, page: number): Promise<FetchPageResult> {
    try {
      const response = await runDiscoveryPreviewViaRest({
        loopId,
        dryRun: true,
        sourceIds: [sourceId],
        page,
        pageSize: PAGE_SIZE,
        cacheOnly: true,
      });
      const runItem =
        response.items.find((i) => i.sourceId === sourceId) ?? response.items[0];
      // Cache is cold — backend scheduled a background refresh. Not an error,
      // but we should keep polling until the warm completes.
      if (runItem?.reason === "cache_warming") {
        return { sourceId, items: [], hasMore: false, errored: false, warming: true };
      }
      // No matches for this source (skipped/unsupported) — not an error.
      if (!runItem || runItem.status === "skipped" || runItem.status === "unsupported") {
        return { sourceId, items: [], hasMore: false, errored: false, warming: false };
      }
      // Adapter ran but failed safely — treat as an error so it isn't
      // indistinguishable from a genuine "no results" outcome.
      if (runItem.status === "failed") {
        return { sourceId, items: [], hasMore: false, errored: true, warming: false };
      }
      return {
        sourceId,
        items: runItem.previewItems.map((item) => ({
          ...item,
          _sourceId: sourceId,
          _sourceLabel: labelMap.get(sourceId) ?? sourceId,
        })),
        hasMore: runItem.hasMore ?? false,
        errored: false,
        warming: false,
      };
    } catch (err) {
      // Surface transport/HTTP errors (e.g. a 4xx/5xx from the preview
      // endpoint) instead of swallowing them as an empty feed.
      console.error(`[DiscoveryPreviewFeed] preview fetch failed for "${sourceId}"`, err);
      return { sourceId, items: [], hasMore: false, errored: true, warming: false };
    }
  }

  async function loadInitial() {
    setIsLoadingFirst(true);
    setError(null);

    const results = await Promise.all(
      sources.map(({ sourceId }) => fetchPage(sourceId, 1)),
    );

    const allItems: FeedItem[] = [];
    const newSourceStates: Record<string, SourceState> = {};
    let erroredCount = 0;
    let warmingCount = 0;

    for (const result of results) {
      if (result.errored) erroredCount += 1;
      if (result.warming) warmingCount += 1;
      allItems.push(...result.items);
      newSourceStates[result.sourceId] = { page: 1, hasMore: result.hasMore };
    }

    setItems(allItems);
    setSourceStates(newSourceStates);
    setIsLoadingFirst(false);

    if (results.length > 0 && erroredCount === results.length) {
      setIsWarming(false);
      setError("Не удалось загрузить вакансии. Попробуйте позже.");
      return;
    }

    // Some sources are still warming in the backend. Poll a few times so the
    // feed fills in once the background fetch lands, without a manual refresh.
    if (warmingCount > 0 && warmRetriesRef.current < MAX_WARM_RETRIES) {
      warmRetriesRef.current += 1;
      setIsWarming(true);
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      retryTimerRef.current = setTimeout(() => {
        void loadInitial();
      }, WARM_RETRY_DELAY_MS);
    } else {
      setIsWarming(false);
    }

    if (allItems.length > 0) {
      warmRetriesRef.current = 0;
      onRunComplete?.();
    }
  }

  async function loadMore() {
    setIsLoadingMore(true);

    const current = sourceStatesRef.current;
    const sourcesToFetch = sources.filter(({ sourceId }) => current[sourceId]?.hasMore);

    const results = await Promise.all(
      sourcesToFetch.map(({ sourceId }) =>
        fetchPage(sourceId, (current[sourceId]?.page ?? 1) + 1),
      ),
    );

    const newItems: FeedItem[] = [];
    const updatedStates = { ...current };
    let warmingCount = 0;

    for (const result of results) {
      // Next page isn't cached yet — backend is warming it. Leave this source's
      // page/hasMore untouched so the retry re-fetches the same page.
      if (result.warming) {
        warmingCount += 1;
        continue;
      }
      newItems.push(...result.items);
      updatedStates[result.sourceId] = {
        page: (current[result.sourceId]?.page ?? 1) + 1,
        hasMore: result.hasMore,
      };
    }

    setItems((prev) => [...prev, ...newItems]);
    setSourceStates(updatedStates);

    // Deeper pages still warming — poll a few times so "Показать ещё" fills in
    // without forcing a manual refresh, mirroring the initial-load behaviour.
    if (warmingCount > 0 && moreRetriesRef.current < MAX_WARM_RETRIES) {
      moreRetriesRef.current += 1;
      if (moreRetryTimerRef.current) clearTimeout(moreRetryTimerRef.current);
      moreRetryTimerRef.current = setTimeout(() => {
        void loadMore();
      }, WARM_RETRY_DELAY_MS);
    } else {
      moreRetriesRef.current = 0;
      setIsLoadingMore(false);
    }
  }

  useEffect(() => {
    if (didAutoRun.current) return;
    didAutoRun.current = true;
    void loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the ref in sync so loadMore's async retries read fresh paging state.
  useEffect(() => {
    sourceStatesRef.current = sourceStates;
  }, [sourceStates]);

  // Clear any pending warm-retry timers on unmount.
  useEffect(() => {
    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
      if (moreRetryTimerRef.current) clearTimeout(moreRetryTimerRef.current);
    };
  }, []);

  function handleRefresh() {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    if (moreRetryTimerRef.current) clearTimeout(moreRetryTimerRef.current);
    warmRetriesRef.current = 0;
    moreRetriesRef.current = 0;
    setIsWarming(false);
    setIsLoadingMore(false);
    setItems([]);
    setSourceStates({});
    setSaveStates({});
    setSaveErrors({});
    setError(null);
    void loadInitial();
  }

  async function handleSave(item: FeedItem) {
    const key = getItemKey(item);
    setSaveStates((prev) => ({ ...prev, [key]: "saving" }));
    setSaveErrors((prev) => ({ ...prev, [key]: null }));
    try {
      const result = await saveDiscoveryPreviewAsMatchViaRest(loopId, {
        sourceId: item._sourceId,
        externalId: item.externalId,
        sourceUrl: item.sourceUrl,
        title: item.title,
        company: item.company,
        location: item.location,
        description: item.snippet,
        postedAt: item.postedAt,
        rawMetadata: item.rawMetadata,
        confidence: item.confidence,
      });
      setSaveStates((prev) => ({
        ...prev,
        [key]: result.duplicate ? "duplicate" : "saved",
      }));
      onMatchSaved?.();
    } catch (saveErr: unknown) {
      setSaveStates((prev) => ({ ...prev, [key]: "idle" }));
      setSaveErrors((prev) => ({
        ...prev,
        [key]: getDiscoveryPreviewSaveErrorMessage(saveErr),
      }));
    }
  }

  const hasMore = Object.values(sourceStates).some((s) => s.hasMore);
  const sourceNames = sources.map((s) => s.label).join(" · ");

  return (
    <section className="rounded-[16px] border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-[15px] font-semibold text-foreground">Предварительный поиск</h3>
          <p className="mt-0.5 text-[12px] text-muted-foreground">
            {sourceNames} · не сохраняется автоматически
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={handleRefresh} disabled={isLoadingFirst}>
          {isLoadingFirst ? "Загружаем…" : "Обновить"}
        </Button>
      </div>

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {error}
        </div>
      ) : isLoadingFirst ? (
        <div className="mt-4 rounded-[10px] bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
          Ищем вакансии в {sourceNames}…
        </div>
      ) : isWarming && items.length === 0 ? (
        <div className="mt-4 rounded-[10px] bg-muted/30 p-3 text-[12.5px] text-muted-foreground">
          Обновляем базу вакансий — это займёт несколько секунд…
        </div>
      ) : !isLoadingFirst && Object.keys(sourceStates).length > 0 && items.length === 0 ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          Вакансии не найдены. Попробуйте уточнить профессию или ключевые слова в настройках.
        </div>
      ) : null}

      {items.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            Найдено: {items.length}
          </div>
          {items.map((item) => {
            const key = getItemKey(item);
            return (
              <FeedCard
                key={key}
                item={item}
                saveState={saveStates[key] ?? "idle"}
                saveError={saveErrors[key] ?? null}
                onSave={() => {
                  void handleSave(item);
                }}
              />
            );
          })}
          {hasMore ? (
            <div className="pt-2 text-center">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  moreRetriesRef.current = 0;
                  void loadMore();
                }}
                disabled={isLoadingMore}
              >
                {isLoadingMore ? "Загружаем…" : "Показать ещё"}
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
