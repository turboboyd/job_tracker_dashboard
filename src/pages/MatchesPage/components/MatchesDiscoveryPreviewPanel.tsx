import { RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { Loop } from "src/entities/loop";
import {
  getDiscoverySourceRuntimeStatusViaRest,
  runDiscoveryPreviewViaRest,
  type DiscoverySearchScope,
  type DiscoveryRunPreviewItem,
  type DiscoveryRunResponse,
  type DiscoverySourceRuntimeStatus,
} from "src/features/discoveryRuns";
import {
  ignoreDiscoveryPreviewViaRest,
  listDiscoveryPreviewIgnoresViaRest,
  saveDiscoveryPreviewAsMatchViaRest,
  unignoreDiscoveryPreviewViaRest,
  type VacancyPreviewIgnore,
} from "src/features/vacancyMatches";
import { ApiError } from "src/shared/api/rest/restClient";
import { Button } from "src/shared/ui";

import type { MatchesFiltersState } from "../model/filters";

import {
  appendMatchesDiscoveryResultsForSource,
  collectMatchesDiscoveryMessagesForSource,
  collectMatchesDiscoveryGlobalMessagesFromResults,
  compareMatchesDiscoverySaveState,
  dedupeMatchesDiscoveryPreviewEntries,
  formatMatchesDiscoveryHiddenDuplicates,
  formatMatchesDiscoveryLastUpdated,
  formatMatchesDiscoverySetupSummary,
  formatMatchesDiscoverySourceResultLabel,
  getMatchesDiscoveryDiagnosticsGroups,
  getMatchesDiscoveryEmptySourceMessage,
  getRunnableDiscoverySourceLabel,
  getMatchesDiscoveryResponseDedupeKeysForSource,
  getMatchesDiscoverySourceFilterOptions,
  getMatchesDiscoverySourceStatusSummary,
  getMatchesDiscoverySourceStatusItems,
  getMatchesDiscoveryTargetLoopIds,
  getMatchesDiscoveryLoopOptions,
  getMatchesDiscoveryPreviewItemKey,
  getMatchesDiscoverySavedPreviewKey,
  getMatchesDiscoverySaveButtonLabel,
  getMatchesDiscoveryWarningMessage,
  isMatchesDiscoverySaveDisabled,
  isMatchesDiscoverySavedState,
  mergeMatchesDiscoveryResultsForSource,
  MATCHES_DISCOVERY_COPY,
  MATCHES_DISCOVERY_PAGE_SIZE,
  MATCHES_DISCOVERY_SEARCH_SCOPE_OPTIONS,
  type MatchesDiscoverySaveState,
} from "./matchesDiscoveryPreview.helpers";

interface MatchesDiscoveryPreviewPanelProps {
  filters: MatchesFiltersState;
  loops: Loop[];
  loopsLoading: boolean;
  savedPreviewKeys?: ReadonlySet<string>;
  onMatchSaved?: () => void | Promise<unknown>;
}

function getRunErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = getMatchesDiscoveryWarningMessage(error.code);
    if (message !== error.code) return message;
  }
  return "Не удалось обновить вакансии. Попробуйте ещё раз.";
}

function getSaveErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = getMatchesDiscoveryWarningMessage(error.code);
    if (message !== error.code) return message;
    if (error.status === 422) {
      return "Не удалось сохранить вакансию. Проверьте ссылку и источник.";
    }
    if (error.status === 404) {
      return "Направление поиска не найдено.";
    }
  }
  return "Не удалось сохранить вакансию. Попробуйте ещё раз.";
}

function getHideErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = getMatchesDiscoveryWarningMessage(error.code);
    if (message !== error.code) return message;
  }
  return "Не удалось скрыть вакансию. Попробуйте ещё раз.";
}

function getRestoreErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const message = getMatchesDiscoveryWarningMessage(error.code);
    if (message !== error.code) return message;
  }
  return "Не удалось вернуть вакансию в preview. Попробуйте ещё раз.";
}

function PreviewCard({
  entry,
  isIgnored,
  saveError,
  saveState,
  onHide,
  onRestore,
  onSave,
}: {
  entry: PreviewEntry;
  isIgnored: boolean;
  saveError: string | null;
  saveState: MatchesDiscoverySaveState;
  onHide: () => void;
  onRestore: () => void;
  onSave: () => void;
}) {
  const { item, loopName } = entry;
  const statusLabel =
    saveState === "saved" || saveState === "duplicate"
      ? getMatchesDiscoverySaveButtonLabel(saveState)
      : MATCHES_DISCOVERY_COPY.notSaved;

  return (
    <div className="rounded-[10px] border border-border bg-background p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[13.5px] font-semibold text-foreground">
            {item.title || MATCHES_DISCOVERY_COPY.titleMissing}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {item.company || MATCHES_DISCOVERY_COPY.companyMissing}
            {item.location ? ` · ${item.location}` : ""}
          </div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">{loopName}</div>
          <div className="mt-0.5 text-[12px] text-muted-foreground">
            {entry.sourceLabel}
          </div>
          {item.snippet ? (
            <p className="mt-2 line-clamp-3 text-[12.5px] text-muted-foreground">
              {item.snippet}
            </p>
          ) : null}
        </div>
        <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
          {statusLabel}
        </span>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={item.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
        >
          {MATCHES_DISCOVERY_COPY.openVacancy}
        </a>
        <Button
          size="sm"
          onClick={onSave}
          disabled={isMatchesDiscoverySaveDisabled(saveState)}
        >
          {getMatchesDiscoverySaveButtonLabel(saveState)}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          shadow="none"
          onClick={isIgnored ? onRestore : onHide}
          disabled={
            saveState === "saving" ||
            (!isIgnored && isMatchesDiscoverySavedState(saveState))
          }
        >
          {isIgnored
            ? MATCHES_DISCOVERY_COPY.restorePreviewItem
            : MATCHES_DISCOVERY_COPY.notInterested}
        </Button>
      </div>

      {saveError ? (
        <div className="mt-2 text-[12px] text-destructive">{saveError}</div>
      ) : null}
    </div>
  );
}

function SourceLoadMoreTrigger({
  disabled,
  onLoadMore,
}: {
  disabled: boolean;
  onLoadMore: () => void;
}) {
  const triggerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = triggerRef.current;
    if (!node || disabled || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) onLoadMore();
      },
      { rootMargin: "220px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, onLoadMore]);

  return <div ref={triggerRef} className="h-px" aria-hidden="true" />;
}

interface PreviewEntry {
  item: DiscoveryRunPreviewItem;
  key: string;
  loopId: string;
  loopName: string;
  sourceId: string;
  sourceLabel: string;
  externalId: string | null;
  sourceUrl: string;
}

function buildRunItemEntries(
  runItem: DiscoveryRunResponse["items"][number],
  loopNameById: Map<string, string>,
): PreviewEntry[] {
  return runItem.previewItems.map((item) => ({
    item,
    loopId: runItem.loopId,
    loopName: loopNameById.get(runItem.loopId) ?? runItem.loopId,
    sourceId: runItem.sourceId ?? "",
    sourceLabel: getRunnableDiscoverySourceLabel(runItem.sourceId),
    externalId: item.externalId,
    sourceUrl: item.sourceUrl,
    key: `${runItem.loopId}:${runItem.sourceId ?? "unknown"}:${getMatchesDiscoveryPreviewItemKey(item)}`,
  }));
}

function buildRawPreviewEntries(
  results: DiscoveryRunResponse[],
  loopNameById: Map<string, string>,
): PreviewEntry[] {
  return results.flatMap((result) =>
    result.items.flatMap((runItem) => buildRunItemEntries(runItem, loopNameById)),
  );
}

function checkResponseSourceHasMore(responses: readonly DiscoveryRunResponse[], sourceId: string): boolean {
  return responses.some((response) =>
    response.items.some((item) => item.sourceId === sourceId && item.hasMore),
  );
}

export function MatchesDiscoveryPreviewPanel({
  filters,
  loops,
  loopsLoading,
  savedPreviewKeys,
  onMatchSaved,
}: MatchesDiscoveryPreviewPanelProps) {
  const loopOptions = useMemo(() => getMatchesDiscoveryLoopOptions(loops), [loops]);
  const loopNameById = useMemo(
    () => new Map(loopOptions.map((option) => [option.id, option.name] as const)),
    [loopOptions],
  );
  const loopSourcesById = useMemo(
    () => new Map(loopOptions.map((option) => [option.id, option.sourceIds] as const)),
    [loopOptions],
  );
  const [selectedLoopId, setSelectedLoopId] = useState("all");
  const targetLoopIds = useMemo(
    () => getMatchesDiscoveryTargetLoopIds(loopOptions, selectedLoopId, filters.loopIds),
    [loopOptions, selectedLoopId, filters.loopIds],
  );
  const targetLoopKey = targetLoopIds.join("|");
  const [selectedSearchScope, setSelectedSearchScope] =
    useState<DiscoverySearchScope>("broad");
  const autoRunKey = `${targetLoopKey}:${selectedSearchScope}`;
  const autoRunKeyRef = useRef("");
  const targetSourceIds = useMemo(
    () => [
      ...new Set(
        targetLoopIds.flatMap((loopId) => loopSourcesById.get(loopId) ?? []),
      ),
    ],
    [loopSourcesById, targetLoopIds],
  );

  const [results, setResults] = useState<DiscoveryRunResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveStates, setSaveStates] = useState<Record<string, MatchesDiscoverySaveState>>({});
  const [saveErrors, setSaveErrors] = useState<Record<string, string | null>>({});
  const [sourceRuntimeStatuses, setSourceRuntimeStatuses] = useState<
    DiscoverySourceRuntimeStatus[] | null
  >(null);
  const [selectedSourceId, setSelectedSourceId] = useState("all");
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [retryingSourceId, setRetryingSourceId] = useState<string | null>(null);
  const [loadingMoreSourceId, setLoadingMoreSourceId] = useState<string | null>(null);
  const [hideSavedPreviewItems, setHideSavedPreviewItems] = useState(true);
  const [showIgnoredPreviewItems, setShowIgnoredPreviewItems] = useState(false);
  const [showSourceSetupGuide, setShowSourceSetupGuide] = useState(false);
  const [ignoredPreviewItemsByKey, setIgnoredPreviewItemsByKey] = useState<
    ReadonlyMap<string, VacancyPreviewIgnore>
  >(
    () => new Map(),
  );
  const [sourcePages, setSourcePages] = useState<Record<string, number>>({});
  const [sourceHasMore, setSourceHasMore] = useState<Record<string, boolean>>({});
  const loadingMoreInFlightRef = useRef<Set<string>>(new Set());
  const previewKeysBySourceRef = useRef<Record<string, Set<string>>>({});
  const isBusy = isLoading || loadingMoreSourceId !== null;

  const rawPreviewEntries = useMemo<PreviewEntry[]>(
    () => buildRawPreviewEntries(results, loopNameById),
    [loopNameById, results],
  );
  const previewEntries = useMemo(
    () => dedupeMatchesDiscoveryPreviewEntries(rawPreviewEntries),
    [rawPreviewEntries],
  );
  const getPreviewSaveState = useCallback(
    (entry: PreviewEntry): MatchesDiscoverySaveState => {
      const localState = saveStates[entry.key];
      if (localState && localState !== "idle") return localState;
      if (savedPreviewKeys?.has(getMatchesDiscoverySavedPreviewKey(entry))) {
        return "duplicate";
      }
      return localState ?? "idle";
    },
    [saveStates, savedPreviewKeys],
  );
  const previewCountBySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of previewEntries) {
      counts.set(entry.sourceId, (counts.get(entry.sourceId) ?? 0) + 1);
    }
    return counts;
  }, [previewEntries]);
  const savedPreviewCountBySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of previewEntries) {
      if (!isMatchesDiscoverySavedState(getPreviewSaveState(entry))) continue;
      counts.set(entry.sourceId, (counts.get(entry.sourceId) ?? 0) + 1);
    }
    return counts;
  }, [getPreviewSaveState, previewEntries]);
  const getPreviewStableKey = useCallback(
    (entry: PreviewEntry) => getMatchesDiscoverySavedPreviewKey(entry),
    [],
  );
  const isPreviewIgnoredByUser = useCallback(
    (entry: PreviewEntry) => ignoredPreviewItemsByKey.has(getPreviewStableKey(entry)),
    [getPreviewStableKey, ignoredPreviewItemsByKey],
  );
  const isPreviewHiddenByUser = useCallback(
    (entry: PreviewEntry) =>
      !showIgnoredPreviewItems && ignoredPreviewItemsByKey.has(getPreviewStableKey(entry)),
    [getPreviewStableKey, ignoredPreviewItemsByKey, showIgnoredPreviewItems],
  );
  const hiddenByUserCountBySource = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of previewEntries) {
      if (!isPreviewIgnoredByUser(entry)) continue;
      counts.set(entry.sourceId, (counts.get(entry.sourceId) ?? 0) + 1);
    }
    return counts;
  }, [isPreviewIgnoredByUser, previewEntries]);
  const hiddenDuplicateCount = rawPreviewEntries.length - previewEntries.length;
  const hiddenDuplicateLabel = formatMatchesDiscoveryHiddenDuplicates(hiddenDuplicateCount);
  const messages = useMemo(
    () => collectMatchesDiscoveryGlobalMessagesFromResults(results),
    [results],
  );
  const previewEntriesForSourceFilter = useMemo(
    () =>
      hideSavedPreviewItems
        ? previewEntries.filter(
            (entry) =>
              !isPreviewHiddenByUser(entry) &&
              !isMatchesDiscoverySavedState(getPreviewSaveState(entry)),
          )
        : previewEntries.filter((entry) => !isPreviewHiddenByUser(entry)),
    [getPreviewSaveState, hideSavedPreviewItems, isPreviewHiddenByUser, previewEntries],
  );
  const sourceFilterOptions = useMemo(
    () =>
      getMatchesDiscoverySourceFilterOptions(
        previewEntriesForSourceFilter.map((entry) => entry.sourceId),
        targetSourceIds,
      ),
    [previewEntriesForSourceFilter, targetSourceIds],
  );
  const sourceFilteredPreviewEntries = useMemo(
    () =>
      selectedSourceId === "all"
        ? previewEntries
        : previewEntries.filter((entry) => entry.sourceId === selectedSourceId),
    [previewEntries, selectedSourceId],
  );
  const sourceFilteredPreviewEntriesAfterManualHidden = useMemo(
    () => sourceFilteredPreviewEntries.filter((entry) => !isPreviewHiddenByUser(entry)),
    [isPreviewHiddenByUser, sourceFilteredPreviewEntries],
  );
  const visiblePreviewEntries = useMemo(
    () => {
      const entries = hideSavedPreviewItems
        ? sourceFilteredPreviewEntriesAfterManualHidden.filter(
            (entry) => !isMatchesDiscoverySavedState(getPreviewSaveState(entry)),
          )
        : sourceFilteredPreviewEntriesAfterManualHidden;

      return [...entries].sort((left, right) =>
        compareMatchesDiscoverySaveState(
          getPreviewSaveState(left),
          getPreviewSaveState(right),
        ),
      );
    },
    [
      getPreviewSaveState,
      hideSavedPreviewItems,
      sourceFilteredPreviewEntriesAfterManualHidden,
    ],
  );
  const hiddenSavedPreviewCount =
    sourceFilteredPreviewEntriesAfterManualHidden.length - visiblePreviewEntries.length;
  const hiddenByUserPreviewCount =
    sourceFilteredPreviewEntries.length -
    sourceFilteredPreviewEntriesAfterManualHidden.length;
  const groupedPreviewEntries = useMemo(() => {
    const groups: Array<{
      sourceId: string;
      sourceLabel: string;
      entries: PreviewEntry[];
    }> = [];
    const groupBySource = new Map<string, (typeof groups)[number]>();

    for (const entry of visiblePreviewEntries) {
      const sourceKey = entry.sourceId || "unknown";
      let group = groupBySource.get(sourceKey);
      if (!group) {
        group = {
          sourceId: sourceKey,
          sourceLabel: entry.sourceLabel,
          entries: [],
        };
        groupBySource.set(sourceKey, group);
        groups.push(group);
      }
      group.entries.push(entry);
    }

    const visibleSourceIds =
      selectedSourceId === "all" ? targetSourceIds : [selectedSourceId];
    for (const sourceId of visibleSourceIds) {
      if (groupBySource.has(sourceId)) continue;
      groupBySource.set(sourceId, {
        sourceId,
        sourceLabel: getRunnableDiscoverySourceLabel(sourceId),
        entries: [],
      });
      groups.push(groupBySource.get(sourceId)!);
    }

    return groups;
  }, [selectedSourceId, targetSourceIds, visiblePreviewEntries]);
  const sourceStatusItems = useMemo(
    () => getMatchesDiscoverySourceStatusItems(sourceRuntimeStatuses ?? undefined),
    [sourceRuntimeStatuses],
  );
  const sourceRuntimeMessageBySource = useMemo(() => {
    const map = new Map<string, string>();
    for (const status of sourceRuntimeStatuses ?? []) {
      if (status.runnable || status.messageCode === "source_ready") continue;
      map.set(status.sourceId, getMatchesDiscoveryWarningMessage(status.messageCode));
    }
    return map;
  }, [sourceRuntimeStatuses]);
  const sourceStatusSummary = useMemo(
    () => getMatchesDiscoverySourceStatusSummary(sourceStatusItems),
    [sourceStatusItems],
  );
  const sourceSetupSummary = useMemo(
    () => formatMatchesDiscoverySetupSummary(sourceStatusItems),
    [sourceStatusItems],
  );
  const diagnosticsGroups = useMemo(
    () => getMatchesDiscoveryDiagnosticsGroups(sourceStatusItems),
    [sourceStatusItems],
  );
  const sourceStatusById = useMemo(
    () => new Map<string, (typeof sourceStatusItems)[number]>(
      sourceStatusItems.map((source) => [source.sourceId, source] as const),
    ),
    [sourceStatusItems],
  );

  const updateSourcePaging = useCallback((
    responses: readonly DiscoveryRunResponse[],
    sourceIds: readonly string[],
    page: number,
  ) => {
    setSourcePages((current) => {
      const next = { ...current };
      for (const sourceId of sourceIds) next[sourceId] = page;
      return next;
    });
    setSourceHasMore((current) => {
      const next = { ...current };
      for (const sourceId of sourceIds) {
        const receivedKeys = getMatchesDiscoveryResponseDedupeKeysForSource(
          responses,
          sourceId,
        );
        const existingKeys = previewKeysBySourceRef.current[sourceId] ?? new Set<string>();
        let newUniqueCount = 0;
        for (const key of receivedKeys) {
          if (!existingKeys.has(key)) newUniqueCount += 1;
          existingKeys.add(key);
        }
        previewKeysBySourceRef.current[sourceId] = existingKeys;
        const backendHasMore = checkResponseSourceHasMore(responses, sourceId);
        next[sourceId] = backendHasMore && newUniqueCount > 0;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadSourceStatuses() {
      try {
        const response = await getDiscoverySourceRuntimeStatusViaRest();
        if (!cancelled) setSourceRuntimeStatuses(response.items);
      } catch {
        if (!cancelled) setSourceRuntimeStatuses(null);
      }
    }

    void loadSourceStatuses();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (targetLoopIds.length === 0) {
        if (!cancelled) setIgnoredPreviewItemsByKey(new Map());
        return;
      }

      const settled = await Promise.allSettled(
        targetLoopIds.map((loopId) => listDiscoveryPreviewIgnoresViaRest(loopId)),
      );
      if (cancelled) return;

      const next = new Map<string, VacancyPreviewIgnore>();
      for (const result of settled) {
        if (result.status !== "fulfilled") continue;
        for (const item of result.value.items) {
          next.set(getMatchesDiscoverySavedPreviewKey(item), item);
        }
      }
      setIgnoredPreviewItemsByKey(next);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [targetLoopIds]);

  const runPreview = useCallback(async (
    loopIds: readonly string[],
    sourceId?: string,
    options: { page?: number; append?: boolean } = {},
  ) => {
    if (loopIds.length === 0) return;
    const page = options.page ?? 1;

    const requests = loopIds
      .map((loopId) => ({
        loopId,
        sourceIds: sourceId
          ? (loopSourcesById.get(loopId) ?? []).filter((id) => id === sourceId)
          : loopSourcesById.get(loopId) ?? [],
      }))
      .filter((request) => request.sourceIds.length > 0);
    if (requests.length === 0) return;

    if (options.append && sourceId) {
      setLoadingMoreSourceId(sourceId);
    } else {
      setIsLoading(true);
    }
    setError(null);
    if (sourceId) {
      setRetryingSourceId(sourceId);
    } else {
      setResults([]);
      setSaveStates({});
      setSaveErrors({});
      setSourcePages({});
      setSourceHasMore({});
      loadingMoreInFlightRef.current.clear();
      previewKeysBySourceRef.current = {};
    }
    if (sourceId && !options.append) {
      delete previewKeysBySourceRef.current[sourceId];
    }

    try {
      const settled = await Promise.allSettled(
        requests.map((request) =>
          runDiscoveryPreviewViaRest({
            loopId: request.loopId,
            dryRun: true,
            sourceIds: request.sourceIds,
            searchScope: selectedSearchScope,
            page,
            pageSize: MATCHES_DISCOVERY_PAGE_SIZE,
          }),
        ),
      );
      const fulfilled = settled
        .filter(
          (entry): entry is PromiseFulfilledResult<DiscoveryRunResponse> =>
            entry.status === "fulfilled",
        )
        .map((entry) => entry.value);
      const rejected = settled.filter(
        (entry): entry is PromiseRejectedResult => entry.status === "rejected",
      );

      setResults((current) =>
        sourceId && options.append
          ? appendMatchesDiscoveryResultsForSource(current, fulfilled, sourceId)
          : sourceId
            ? mergeMatchesDiscoveryResultsForSource(current, fulfilled, sourceId)
          : fulfilled,
      );
      updateSourcePaging(
        fulfilled,
        sourceId ? [sourceId] : [...new Set(requests.flatMap((request) => request.sourceIds))],
        page,
      );
      if (rejected.length > 0) {
        setError(getRunErrorMessage(rejected[0].reason));
      }
      setLastUpdatedAt(new Date());
    } catch (runError: unknown) {
      setError(getRunErrorMessage(runError));
    } finally {
      if (options.append && sourceId) {
        setLoadingMoreSourceId(null);
      } else {
        setIsLoading(false);
      }
      if (sourceId) {
        setRetryingSourceId(null);
      }
    }
  }, [loopSourcesById, selectedSearchScope, updateSourcePaging]);

  useEffect(() => {
    if (loopsLoading || targetLoopIds.length === 0) return;
    if (autoRunKeyRef.current === autoRunKey) return;

    autoRunKeyRef.current = autoRunKey;
    void runPreview(targetLoopIds);
  }, [autoRunKey, loopsLoading, runPreview, targetLoopIds]);

  useEffect(() => {
    if (selectedSourceId === "all") return;
    if (sourceFilterOptions.some((option) => option.id === selectedSourceId)) return;
    setSelectedSourceId("all");
  }, [selectedSourceId, sourceFilterOptions]);

  const handleLoadMoreSource = useCallback((sourceId: string) => {
    if (!sourceHasMore[sourceId]) return;
    if (isBusy) return;
    if (loadingMoreInFlightRef.current.has(sourceId)) return;
    const nextPage = (sourcePages[sourceId] ?? 1) + 1;
    loadingMoreInFlightRef.current.add(sourceId);
    void runPreview(targetLoopIds, sourceId, { page: nextPage, append: true }).finally(
      () => {
        loadingMoreInFlightRef.current.delete(sourceId);
      },
    );
  }, [
    isBusy,
    loadingMoreSourceId,
    runPreview,
    sourceHasMore,
    sourcePages,
    targetLoopIds,
  ]);

  const handleSearchBroaderSource = useCallback((sourceId: string) => {
    setSelectedSearchScope("broad");
    void runPreview(targetLoopIds, sourceId);
  }, [runPreview, targetLoopIds]);

  async function handleSavePreviewItem(entry: PreviewEntry) {
    const { item, key, loopId, sourceId } = entry;
    setSaveStates((current) => ({ ...current, [key]: "saving" }));
    setSaveErrors((current) => ({ ...current, [key]: null }));

    try {
      const response = await saveDiscoveryPreviewAsMatchViaRest(loopId, {
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
      });

      setSaveStates((current) => ({
        ...current,
        [key]: response.duplicate ? "duplicate" : "saved",
      }));
      await onMatchSaved?.();
    } catch (saveError: unknown) {
      setSaveStates((current) => ({ ...current, [key]: "idle" }));
      setSaveErrors((current) => ({
        ...current,
        [key]: getSaveErrorMessage(saveError),
      }));
    }
  }

  async function handleHidePreviewItem(entry: PreviewEntry) {
    const stableKey = getPreviewStableKey(entry);
    setSaveErrors((current) => ({ ...current, [entry.key]: null }));

    try {
      const response = await ignoreDiscoveryPreviewViaRest(entry.loopId, {
        sourceId: entry.sourceId,
        externalId: entry.item.externalId,
        sourceUrl: entry.item.sourceUrl,
        title: entry.item.title,
        company: entry.item.company,
      });
      setIgnoredPreviewItemsByKey((current) => {
        const next = new Map(current);
        next.set(stableKey, response.item);
        return next;
      });
    } catch (hideError: unknown) {
      setSaveErrors((current) => ({
        ...current,
        [entry.key]: getHideErrorMessage(hideError),
      }));
    }
  }

  async function handleRestorePreviewItem(entry: PreviewEntry) {
    const stableKey = getPreviewStableKey(entry);
    const ignoredItem = ignoredPreviewItemsByKey.get(stableKey);
    if (!ignoredItem) return;

    setIgnoredPreviewItemsByKey((current) => {
      const next = new Map(current);
      next.delete(stableKey);
      return next;
    });
    setSaveErrors((current) => ({ ...current, [entry.key]: null }));

    try {
      await unignoreDiscoveryPreviewViaRest(entry.loopId, ignoredItem.id);
    } catch (restoreError: unknown) {
      setIgnoredPreviewItemsByKey((current) => {
        const next = new Map(current);
        next.set(stableKey, ignoredItem);
        return next;
      });
      setSaveErrors((current) => ({
        ...current,
        [entry.key]: getRestoreErrorMessage(restoreError),
      }));
    }
  }

  return (
    <section className="mb-5 rounded-[14px] border border-border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-3xl">
          <h2 className="text-[16px] font-semibold text-foreground">
            {MATCHES_DISCOVERY_COPY.title}
          </h2>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {MATCHES_DISCOVERY_COPY.intro} {MATCHES_DISCOVERY_COPY.supportedOnly}
          </p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {MATCHES_DISCOVERY_COPY.saveBoundary}{" "}
            {MATCHES_DISCOVERY_COPY.noAutoApplication}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="matches-discovery-loop">
            {MATCHES_DISCOVERY_COPY.loopLabel}
          </label>
          <select
            id="matches-discovery-loop"
            value={selectedLoopId}
            onChange={(event) => setSelectedLoopId(event.target.value)}
            disabled={loopsLoading || loopOptions.length === 0 || isBusy}
            className="h-8 min-w-[220px] rounded-md border border-border bg-background px-3 text-[12.5px] text-foreground disabled:opacity-50"
          >
            <option value="all">{MATCHES_DISCOVERY_COPY.allLoops}</option>
            {loopOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="matches-discovery-source">
            {MATCHES_DISCOVERY_COPY.sourceLabel}
          </label>
          <select
            id="matches-discovery-source"
            value={selectedSourceId}
            onChange={(event) => setSelectedSourceId(event.target.value)}
            disabled={previewEntries.length === 0 || isBusy}
            className="h-8 min-w-[180px] rounded-md border border-border bg-background px-3 text-[12.5px] text-foreground disabled:opacity-50"
          >
            {sourceFilterOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label} ({option.count})
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="matches-discovery-search-scope">
            {MATCHES_DISCOVERY_COPY.searchScopeLabel}
          </label>
          <select
            id="matches-discovery-search-scope"
            value={selectedSearchScope}
            onChange={(event) =>
              setSelectedSearchScope(event.target.value as DiscoverySearchScope)
            }
            disabled={isBusy}
            className="h-8 min-w-[130px] rounded-md border border-border bg-background px-3 text-[12.5px] text-foreground disabled:opacity-50"
          >
            {MATCHES_DISCOVERY_SEARCH_SCOPE_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
          <label className="flex h-8 items-center gap-2 rounded-md border border-border bg-background px-3 text-[12.5px] text-muted-foreground">
            <input
              type="checkbox"
              checked={hideSavedPreviewItems}
              onChange={(event) => setHideSavedPreviewItems(event.target.checked)}
              className="h-3.5 w-3.5 accent-primary"
            />
            {MATCHES_DISCOVERY_COPY.hideSavedToggle}
          </label>
          <Button
            size="sm"
            onClick={() => {
              void runPreview(targetLoopIds);
            }}
            disabled={targetLoopIds.length === 0 || loopsLoading || isBusy}
          >
            <RefreshCw className={`mr-1.5 h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            {isLoading ? MATCHES_DISCOVERY_COPY.loading : MATCHES_DISCOVERY_COPY.runButton}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        {sourceStatusItems.map((source) => {
          const canRefreshSource = targetSourceIds.includes(source.sourceId);
          const isRefreshingSource = retryingSourceId === source.sourceId;
          const sourceResultCount = previewCountBySource.get(source.sourceId) ?? 0;
          const savedSourceResultCount = savedPreviewCountBySource.get(source.sourceId) ?? 0;
          const hiddenSourceResultCount =
            hiddenByUserCountBySource.get(source.sourceId) ?? 0;
          const runtimeMessage = sourceRuntimeMessageBySource.get(source.sourceId);
          const sourceMessages = collectMatchesDiscoveryMessagesForSource(
            results,
            source.sourceId,
          );
          const lastSourceMessage = sourceMessages[0] ?? runtimeMessage;

          return (
            <div
              key={source.sourceId}
              className="rounded-[10px] border border-border bg-background px-3 py-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[12.5px] font-semibold text-foreground">
                  {source.label}
                </span>
                <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  {source.statusLabel}
                </span>
              </div>
              <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                {source.description}
              </p>
              <p className="mt-2 text-[11.5px] font-medium text-muted-foreground">
                {formatMatchesDiscoverySourceResultLabel(
                  sourceResultCount,
                  sourceHasMore[source.sourceId],
                  savedSourceResultCount,
                  hiddenSourceResultCount,
                )}
              </p>
              {lastSourceMessage ? (
                <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                  {MATCHES_DISCOVERY_COPY.sourceLastMessagePrefix}:{" "}
                  {lastSourceMessage}
                </p>
              ) : null}
              <Button
                size="sm"
                variant="ghost"
                shadow="none"
                className="mt-2 h-7 px-2 text-[11.5px]"
                onClick={() => {
                  void runPreview(targetLoopIds, source.sourceId);
                }}
                disabled={!canRefreshSource || isBusy}
                title={
                  canRefreshSource
                    ? MATCHES_DISCOVERY_COPY.retrySource
                    : MATCHES_DISCOVERY_COPY.refreshSourceUnavailable
                }
              >
                <RefreshCw
                  className={`mr-1.5 h-3.5 w-3.5 ${isRefreshingSource ? "animate-spin" : ""}`}
                />
                {MATCHES_DISCOVERY_COPY.refreshSource}
              </Button>
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[12px] text-muted-foreground">
        {sourceStatusSummary.label} {formatMatchesDiscoveryLastUpdated(lastUpdatedAt)}
      </p>
      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span>{sourceSetupSummary}</span>
        <button
          type="button"
          className="font-medium text-foreground underline-offset-4 hover:underline"
          onClick={() => setShowSourceSetupGuide((value) => !value)}
        >
          {showSourceSetupGuide ? "Скрыть инструкцию" : "Как подключить остальные"}
        </button>
      </div>
      {showSourceSetupGuide ? (
        <div className="mt-3 rounded-[10px] border border-border bg-background p-3 text-[12px] text-muted-foreground">
          <div className="font-semibold text-foreground">Как включить источники с настройкой</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              Adzuna: добавьте на backend <code>ADZUNA_APP_ID</code> и{" "}
              <code>ADZUNA_APP_KEY</code>.
            </li>
            <li>
              Greenhouse: добавьте <code>GREENHOUSE_BOARD_TOKENS</code>, например
              публичные board names компаний.
            </li>
            <li>
              Lever: добавьте <code>LEVER_SITE_NAMES</code>, например публичные
              site names компаний.
            </li>
          </ul>
          <p className="mt-2">
            Значения хранятся только в backend env. Не добавляйте ключи во frontend и не коммитьте реальные значения.
          </p>
        </div>
      ) : null}
      {diagnosticsGroups.length > 0 ? (
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {diagnosticsGroups.map((group) => (
            <div
              key={group.title}
              className="rounded-[10px] border border-border bg-background p-3"
            >
              <div className="text-[12px] font-semibold text-foreground">
                {group.title}
              </div>
              <p className="mt-1 text-[11.5px] leading-5 text-muted-foreground">
                {group.description}
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {group.items.map((source) => (
                  <span
                    key={source.sourceId}
                    className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-muted-foreground"
                  >
                    {source.label}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {loopOptions.length === 0 && !loopsLoading ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {MATCHES_DISCOVERY_COPY.noEligibleLoops}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-[10px] border border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {messages.length > 0 ? (
        <div className="mt-4 rounded-[10px] border border-border bg-muted/30 p-3">
          <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-muted-foreground">
            {messages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {results.length > 0 && previewEntries.length === 0 && !isBusy ? (
        <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          {MATCHES_DISCOVERY_COPY.empty}
        </div>
      ) : null}

      {previewEntries.length > 0 &&
      visiblePreviewEntries.length === 0 &&
      hiddenByUserPreviewCount > 0 &&
      !isBusy ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          <span>{MATCHES_DISCOVERY_COPY.allPreviewItemsHiddenByUser}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowIgnoredPreviewItems(true)}
          >
            {MATCHES_DISCOVERY_COPY.showHiddenPreviewItems}
          </Button>
        </div>
      ) : null}

      {previewEntries.length > 0 &&
      visiblePreviewEntries.length === 0 &&
      hiddenSavedPreviewCount > 0 &&
      hiddenByUserPreviewCount === 0 &&
      !isBusy ? (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
          <span>{MATCHES_DISCOVERY_COPY.allPreviewItemsHiddenAsSaved}</span>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setHideSavedPreviewItems(false)}
          >
            {MATCHES_DISCOVERY_COPY.showSavedPreviewItems}
          </Button>
        </div>
      ) : null}

      {previewEntries.length > 0 ? (
        <div className="mt-4 space-y-2">
          <div className="text-[12px] font-medium text-muted-foreground">
            {MATCHES_DISCOVERY_COPY.previewCountPrefix}: {visiblePreviewEntries.length}.{" "}
            {MATCHES_DISCOVERY_COPY.refreshAfterSave}
            {hiddenDuplicateLabel ? ` ${hiddenDuplicateLabel}.` : ""}
            {hiddenSavedPreviewCount > 0
              ? ` ${MATCHES_DISCOVERY_COPY.hiddenSavedPrefix}: ${hiddenSavedPreviewCount}.`
              : ""}
            {hiddenByUserPreviewCount > 0
              ? ` ${MATCHES_DISCOVERY_COPY.hiddenByUserPrefix}: ${hiddenByUserPreviewCount}.`
              : ""}
          </div>
          {groupedPreviewEntries.map((group) => (
            <div key={group.sourceId} className="space-y-2">
              <div className="flex items-center justify-between gap-3 rounded-[10px] border border-border bg-background px-3 py-2">
                <span className="text-[12.5px] font-semibold text-foreground">
                  {group.sourceLabel}
                </span>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                    {group.entries.length}
                  </span>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      void runPreview(targetLoopIds, group.sourceId);
                    }}
                    disabled={isBusy || retryingSourceId === group.sourceId}
                  >
                    <RefreshCw
                      className={`mr-1.5 h-3.5 w-3.5 ${
                        retryingSourceId === group.sourceId ? "animate-spin" : ""
                      }`}
                    />
                    {MATCHES_DISCOVERY_COPY.retrySource}
                  </Button>
                </div>
              </div>
              {collectMatchesDiscoveryMessagesForSource(results, group.sourceId).length > 0 ? (
                <div className="rounded-[10px] border border-border bg-muted/30 p-3">
                  <ul className="list-disc space-y-1 pl-5 text-[12.5px] text-muted-foreground">
                    {collectMatchesDiscoveryMessagesForSource(results, group.sourceId).map(
                      (message) => (
                        <li key={message}>{message}</li>
                      ),
                    )}
                  </ul>
                </div>
              ) : null}
              {group.entries.length === 0 ? (
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-dashed border-border bg-background p-3 text-[12.5px] text-muted-foreground">
                  <span>
                    {hideSavedPreviewItems &&
                    (savedPreviewCountBySource.get(group.sourceId) ?? 0) > 0
                      ? MATCHES_DISCOVERY_COPY.sourceHiddenSavedOnly
                      : (hiddenByUserCountBySource.get(group.sourceId) ?? 0) > 0
                        ? MATCHES_DISCOVERY_COPY.allPreviewItemsHiddenByUser
                        : getMatchesDiscoveryEmptySourceMessage(
                            sourceStatusById.get(group.sourceId),
                            sourceRuntimeMessageBySource.get(group.sourceId),
                          )}
                  </span>
                  {sourceStatusById.get(group.sourceId)?.state === "ready" &&
                  !sourceRuntimeMessageBySource.has(group.sourceId) &&
                  group.entries.length === 0 ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSearchBroaderSource(group.sourceId)}
                      disabled={isBusy}
                    >
                      <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                      {MATCHES_DISCOVERY_COPY.searchBroaderSource}
                    </Button>
                  ) : null}
                </div>
              ) : null}
              {group.entries.map((entry) => (
                <PreviewCard
                  key={entry.key}
                  entry={entry}
                  isIgnored={isPreviewIgnoredByUser(entry)}
                  saveState={getPreviewSaveState(entry)}
                  saveError={saveErrors[entry.key] ?? null}
                  onSave={() => {
                    void handleSavePreviewItem(entry);
                  }}
                  onHide={() => {
                    void handleHidePreviewItem(entry);
                  }}
                  onRestore={() => {
                    void handleRestorePreviewItem(entry);
                  }}
                />
              ))}
              {sourceHasMore[group.sourceId] ? (
                <div className="flex justify-center py-2">
                  <SourceLoadMoreTrigger
                    disabled={
                      isBusy ||
                      !sourceHasMore[group.sourceId]
                    }
                    onLoadMore={() => handleLoadMoreSource(group.sourceId)}
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleLoadMoreSource(group.sourceId)}
                    disabled={isBusy}
                  >
                    <RefreshCw
                      className={`mr-1.5 h-3.5 w-3.5 ${
                        loadingMoreSourceId === group.sourceId ? "animate-spin" : ""
                      }`}
                    />
                    {loadingMoreSourceId === group.sourceId
                      ? MATCHES_DISCOVERY_COPY.loadingMore
                      : MATCHES_DISCOVERY_COPY.loadMore}
                  </Button>
                </div>
              ) : null}
              {group.entries.length > 0 && sourceHasMore[group.sourceId] === false ? (
                <div className="rounded-[10px] border border-dashed border-border bg-background p-3 text-center text-[12.5px] text-muted-foreground">
                  {MATCHES_DISCOVERY_COPY.noMoreForSource}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
