import { RefreshCw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { DiscoveryRunPreviewItem, DiscoveryRunResponse } from "src/features/discoveryRuns";
import { runDiscoveryPreviewViaRest } from "src/features/discoveryRuns";
import {
  ignoreDiscoveryPreviewViaRest,
  listDiscoveryPreviewIgnoresViaRest,
  saveDiscoveryPreviewAsApplicationViaRest,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import {
  dedupeMatchesDiscoveryPreviewEntries,
  getDefaultMatchesDiscoverySourceIds,
  getMatchesDiscoveryLoopOptions,
  getMatchesDiscoveryPreviewItemKey,
  getMatchesDiscoverySavedPreviewKey,
  getMatchesDiscoverySaveButtonLabel,
  isMatchesDiscoverySaveDisabled,
  isMatchesDiscoverySavedState,
  MATCHES_DISCOVERY_COPY,
  getRunnableDiscoverySourceLabel,
  type MatchesDiscoveryLoopOption,
  type MatchesDiscoverySaveState,
} from "./components/matchesDiscoveryPreview.helpers";
import { useMatchesPageController } from "./model/useMatchesPageController";

// ─── Types ───────────────────────────────────────────────────────────────────

interface DiscoveryPageEntry {
  item: DiscoveryRunPreviewItem;
  key: string;
  stableKey: string;
  loopId: string;
  loopName: string;
  sourceId: string;
  sourceLabel: string;
  externalId: string | null;
  sourceUrl: string;
}

type DiscoveryStatusTab = "all" | "new" | "saved" | "hidden";

// ─── Constants ────────────────────────────────────────────────────────────────

const DISPLAY_PAGE_SIZE = 20;
const BACKEND_PAGE_SIZE = 5;
const DEFAULT_SOURCE_IDS = getDefaultMatchesDiscoverySourceIds();

const STATUS_TABS: Array<{ key: DiscoveryStatusTab; label: string }> = [
  { key: "all",    label: "All"    },
  { key: "new",    label: "New"    },
  { key: "saved",  label: "Added"  },
  { key: "hidden", label: "Hidden" },
];

// ─── Module-level helpers ─────────────────────────────────────────────────────

function extractSourceHasMore(
  resp: DiscoveryRunResponse,
  loopId: string,
): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const runItem of resp.items) {
    const sid = runItem.sourceId ?? "unknown";
    result[`${loopId}:${sid}`] = runItem.hasMore ?? false;
  }
  return result;
}

function buildEntriesFromResponse(
  response: DiscoveryRunResponse,
  loopId: string,
  loopName: string,
): DiscoveryPageEntry[] {
  return response.items.flatMap((runItem) => {
    const sourceId = runItem.sourceId ?? "unknown";
    const sourceLabel = getRunnableDiscoverySourceLabel(sourceId);
    return runItem.previewItems.map((item) => {
      const { externalId, sourceUrl } = item;
      const itemKey = getMatchesDiscoveryPreviewItemKey(item);
      return {
        item,
        key: `${loopId}:${sourceId}:${itemKey}`,
        stableKey: getMatchesDiscoverySavedPreviewKey({ loopId, sourceId, externalId, sourceUrl }),
        loopId,
        loopName,
        sourceId,
        sourceLabel,
        externalId,
        sourceUrl,
      };
    });
  });
}

async function loadDiscoveryPage1(
  loopOptions: MatchesDiscoveryLoopOption[],
  loopIds: string[],
): Promise<{ entries: DiscoveryPageEntry[]; ignoredKeys: Set<string>; sourceHasMore: Record<string, boolean> }> {
  const [discoveryGroups, ignoreEnvelopes] = await Promise.all([
    Promise.all(
      loopOptions.map(async (opt) => {
        const resp = await runDiscoveryPreviewViaRest({
          loopId: opt.id,
          dryRun: true,
          sourceIds: DEFAULT_SOURCE_IDS,
          pageSize: BACKEND_PAGE_SIZE,
        });
        return {
          entries: buildEntriesFromResponse(resp, opt.id, opt.name),
          hasMore: extractSourceHasMore(resp, opt.id),
        };
      }),
    ),
    Promise.all(loopIds.map((id) => listDiscoveryPreviewIgnoresViaRest(id))),
  ]);

  const entries = dedupeMatchesDiscoveryPreviewEntries(
    discoveryGroups.flatMap((g) => g.entries),
  );

  const sourceHasMore: Record<string, boolean> = {};
  for (const { hasMore } of discoveryGroups) {
    Object.assign(sourceHasMore, hasMore);
  }

  const ignoredKeys = new Set<string>();
  for (const envelope of ignoreEnvelopes) {
    for (const ignore of envelope.items) {
      ignoredKeys.add(getMatchesDiscoverySavedPreviewKey(ignore));
    }
  }

  return { entries, ignoredKeys, sourceHasMore };
}

async function loadDiscoveryNextPage(
  loopOptions: MatchesDiscoveryLoopOption[],
  currentHasMore: Record<string, boolean>,
  page: number,
): Promise<{ entries: DiscoveryPageEntry[]; nextHasMore: Record<string, boolean> }> {
  const results = await Promise.all(
    loopOptions.map(async (opt) => {
      const activeSrcIds = DEFAULT_SOURCE_IDS.filter(
        (sid) => currentHasMore[`${opt.id}:${sid}`] !== false,
      );
      if (activeSrcIds.length === 0) {
        return { entries: [] as DiscoveryPageEntry[], hasMore: {} as Record<string, boolean> };
      }
      const resp = await runDiscoveryPreviewViaRest({
        loopId: opt.id,
        dryRun: true,
        sourceIds: activeSrcIds,
        page,
        pageSize: BACKEND_PAGE_SIZE,
      });
      return {
        entries: buildEntriesFromResponse(resp, opt.id, opt.name),
        hasMore: extractSourceHasMore(resp, opt.id),
      };
    }),
  );

  const entries = dedupeMatchesDiscoveryPreviewEntries(
    results.flatMap((r) => r.entries),
  );

  const nextHasMore = { ...currentHasMore };
  for (const { hasMore } of results) {
    Object.assign(nextHasMore, hasMore);
  }

  return { entries, nextHasMore };
}

function getScoreBadgeClass(score: number): string {
  if (score >= 85) return "border-primary/30 bg-primary/10 text-primary";
  if (score >= 70) return "border-border bg-muted text-foreground";
  return "border-border bg-muted text-muted-foreground";
}

function getConfidenceScore(confidence: Record<string, number>): number | null {
  const val = confidence?.overall ?? confidence?.score ?? confidence?.match ?? null;
  return typeof val === "number" ? Math.round(val) : null;
}

// ─── SourcesStrip ────────────────────────────────────────────────────────────

function SourcesStrip({
  sources,
  totalCount,
  activeSource,
  onSetSource,
}: {
  sources: Array<{ key: string; label: string; count: number }>;
  totalCount: number;
  activeSource: string;
  onSetSource: (src: string) => void;
}) {
  if (sources.length === 0) return null;

  function pillClass(isActive: boolean): string {
    return [
      "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11.5px] transition-colors cursor-pointer whitespace-nowrap shrink-0",
      isActive
        ? "border-primary bg-primary/10 text-primary font-medium"
        : "border-border bg-muted text-muted-foreground hover:bg-muted/80",
    ].join(" ");
  }

  return (
    <div className="shrink-0 flex items-center gap-2 overflow-x-auto border-b border-border bg-background px-7 py-3">
      <button type="button" onClick={() => onSetSource("all")} className={pillClass(activeSource === "all")}>
        All sources
        <span className="tabular-nums">{totalCount}</span>
      </button>
      <div className="h-4 w-px shrink-0 bg-border" />
      {sources.map(({ key, label, count }) => (
        <button key={key} type="button" onClick={() => onSetSource(key)} className={pillClass(activeSource === key)}>
          {label}
          <span className="tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  );
}

// ─── StatusTabBar ─────────────────────────────────────────────────────────────

function StatusTabBar({
  counts,
  activeStatus,
  onSetStatus,
}: {
  counts: Record<DiscoveryStatusTab, number>;
  activeStatus: DiscoveryStatusTab;
  onSetStatus: (s: DiscoveryStatusTab) => void;
}) {
  return (
    <div className="shrink-0 flex items-end border-b border-border bg-background px-7">
      {STATUS_TABS.map((tab) => (
        <button
          key={tab.key}
          type="button"
          onClick={() => onSetStatus(tab.key)}
          className={[
            "inline-flex items-center gap-2 px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap",
            activeStatus === tab.key
              ? "border-primary text-foreground font-medium"
              : "border-transparent text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {tab.label}
          <span className={`tabular-nums text-[11px] ${activeStatus === tab.key ? "text-primary" : "text-muted-foreground/60"}`}>
            {counts[tab.key]}
          </span>
        </button>
      ))}
    </div>
  );
}

// ─── PreviewEntryRow ──────────────────────────────────────────────────────────

function PreviewEntryRow({
  entry,
  saveState,
  isIgnored,
  isActive,
  onClick,
}: {
  entry: DiscoveryPageEntry;
  saveState: MatchesDiscoverySaveState;
  isIgnored: boolean;
  isActive: boolean;
  onClick: () => void;
}) {
  const { item, loopName, sourceLabel } = entry;
  const avatarLetter = (item.company || item.title || "?").charAt(0).toUpperCase();
  const score = getConfidenceScore(item.confidence);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onClick(); }}
      className={[
        "flex cursor-pointer items-start gap-3 border-b border-border px-4 py-3.5 transition-colors last:border-b-0 focus:outline-none",
        isActive ? "bg-muted/40 border-l-2 border-l-primary" : "border-l-2 border-l-transparent hover:bg-muted/20",
      ].join(" ")}
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[12px] font-semibold text-foreground select-none">
        {avatarLetter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground leading-tight">
            {item.title || MATCHES_DISCOVERY_COPY.titleMissing}
          </span>
          {isIgnored ? (
            <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground/60">
              Hidden
            </span>
          ) : null}
          {!isIgnored && isMatchesDiscoverySavedState(saveState) ? (
            <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              Added
            </span>
          ) : null}
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
          {[item.company, item.location, sourceLabel].filter(Boolean).join(" · ")}
        </div>
        {loopName ? (
          <div className="mt-0.5 text-[11px] text-muted-foreground/60 truncate">{loopName}</div>
        ) : null}
      </div>
      {score !== null ? (
        <div className={`shrink-0 flex h-8 w-8 items-center justify-center rounded-[6px] border text-[12px] font-semibold tabular-nums leading-none ${getScoreBadgeClass(score)}`}>
          {score}
        </div>
      ) : null}
    </div>
  );
}

// ─── PreviewDetailPane ────────────────────────────────────────────────────────

function PreviewDetailActions({
  entry,
  saveState,
  isIgnored,
  isSaving,
  isIgnoring,
  onSave,
  onIgnore,
}: {
  entry: DiscoveryPageEntry;
  saveState: MatchesDiscoverySaveState;
  isIgnored: boolean;
  isSaving: boolean;
  isIgnoring: boolean;
  onSave: () => void;
  onIgnore: () => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={isMatchesDiscoverySaveDisabled(saveState)}
        onClick={onSave}
        className="rounded-[7px] bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {isSaving ? MATCHES_DISCOVERY_COPY.saving : getMatchesDiscoverySaveButtonLabel(saveState)}
      </button>
      <a
        href={entry.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-[7px] border border-border px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
      >
        {MATCHES_DISCOVERY_COPY.openVacancy} ↗
      </a>
      {!isIgnored ? (
        <button
          type="button"
          disabled={isIgnoring}
          onClick={onIgnore}
          className="rounded-[7px] border border-border px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
        >
          {isIgnoring ? "…" : MATCHES_DISCOVERY_COPY.notInterested}
        </button>
      ) : null}
    </div>
  );
}

function PreviewDetailPane({
  entry,
  saveState,
  isIgnored,
  savingKey,
  ignoringKey,
  onSave,
  onIgnore,
}: {
  entry: DiscoveryPageEntry | null;
  saveState: MatchesDiscoverySaveState;
  isIgnored: boolean;
  savingKey: string | null;
  ignoringKey: string | null;
  onSave: (e: DiscoveryPageEntry) => void;
  onIgnore: (e: DiscoveryPageEntry) => void;
}) {
  if (!entry) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card text-[12.5px] text-muted-foreground">
        Select a vacancy to see details
      </div>
    );
  }

  const { item, sourceLabel } = entry;
  const avatarLetter = (item.company || item.title || "?").charAt(0).toUpperCase();
  const score = getConfidenceScore(item.confidence);
  const isSaving = savingKey === entry.key;
  const isIgnoring = ignoringKey === entry.key;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex gap-3 items-start mb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] border border-border bg-muted text-[15px] font-semibold text-foreground select-none">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                {sourceLabel}
              </span>
              {score !== null ? (
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold tabular-nums ${getScoreBadgeClass(score)}`}>
                  {score}
                </span>
              ) : null}
            </div>
            <div className="text-[16px] font-semibold leading-snug text-foreground tracking-tight">
              {item.title || MATCHES_DISCOVERY_COPY.titleMissing}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-0.5">
              {[item.company, item.location].filter(Boolean).join(" · ") || MATCHES_DISCOVERY_COPY.companyMissing}
            </div>
          </div>
        </div>
        <PreviewDetailActions
          entry={entry}
          saveState={saveState}
          isIgnored={isIgnored}
          isSaving={isSaving}
          isIgnoring={isIgnoring}
          onSave={() => onSave(entry)}
          onIgnore={() => onIgnore(entry)}
        />
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        <a
          href={entry.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[12px] text-primary hover:underline"
        >
          {entry.sourceUrl}
        </a>

        {item.snippet ? (
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Description
            </div>
            <div className="text-[12.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-[20]">
              {item.snippet}
            </div>
          </div>
        ) : null}

        {isIgnored ? (
          <div className="rounded-[10px] border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
            {MATCHES_DISCOVERY_COPY.notInterested} — скрыто вами
          </div>
        ) : null}

        {isMatchesDiscoverySavedState(saveState) ? (
          <div className="rounded-[10px] border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-900/10 p-3 text-[12px] text-emerald-700 dark:text-emerald-400">
            {MATCHES_DISCOVERY_COPY.refreshAfterSave}
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── MatchesBody ─────────────────────────────────────────────────────────────

function MatchesBody({
  isLoading,
  allEntries,
  filteredAll,
  filtered,
  selectedEntry,
  saveStates,
  ignoredKeys,
  savingKey,
  ignoringKey,
  canLoadMore,
  isLoadingMore,
  onSelectKey,
  onSave,
  onIgnore,
  onLoadMore,
}: {
  isLoading: boolean;
  allEntries: DiscoveryPageEntry[];
  filteredAll: DiscoveryPageEntry[];
  filtered: DiscoveryPageEntry[];
  selectedEntry: DiscoveryPageEntry | null;
  saveStates: Record<string, MatchesDiscoverySaveState>;
  ignoredKeys: Set<string>;
  savingKey: string | null;
  ignoringKey: string | null;
  canLoadMore: boolean;
  isLoadingMore: boolean;
  onSelectKey: (key: string) => void;
  onSave: (entry: DiscoveryPageEntry) => void;
  onIgnore: (entry: DiscoveryPageEntry) => void;
  onLoadMore: () => void;
}) {
  if (isLoading) {
    return (
      <div className="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
        <div className="overflow-hidden rounded-xl border border-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0">
              <div className="h-8 w-8 shrink-0 animate-pulse rounded-[7px] bg-muted" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 w-48 animate-pulse rounded bg-muted" />
                <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
        <div className="animate-pulse rounded-xl border border-border bg-card" />
      </div>
    );
  }

  if (allEntries.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground">No vacancies yet</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            {MATCHES_DISCOVERY_COPY.empty}
          </p>
        </div>
      </div>
    );
  }

  const detailEntry = selectedEntry ?? filtered[0] ?? null;
  let detailSaveState: MatchesDiscoverySaveState = "idle";
  if (detailEntry) detailSaveState = saveStates[detailEntry.key] ?? "idle";
  const detailIsIgnored = detailEntry ? ignoredKeys.has(detailEntry.stableKey) : false;

  const showingLabel = filtered.length < filteredAll.length
    ? `${filtered.length} of ${filteredAll.length}`
    : String(filtered.length);

  return (
    <div className="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="shrink-0 flex items-center border-b border-border px-4 py-2.5">
          <span className="text-[12px] text-muted-foreground">
            <strong className="font-semibold text-foreground tabular-nums">{showingLabel}</strong> vacancies
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] font-medium text-foreground">Nothing here</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Try a different filter or source.</p>
            </div>
          ) : (
            <>
              {filtered.map((entry) => (
                <PreviewEntryRow
                  key={entry.key}
                  entry={entry}
                  saveState={saveStates[entry.key] ?? "idle"}
                  isIgnored={ignoredKeys.has(entry.stableKey)}
                  isActive={detailEntry?.key === entry.key}
                  onClick={() => onSelectKey(entry.key)}
                />
              ))}
              {canLoadMore ? (
                <button
                  type="button"
                  disabled={isLoadingMore}
                  onClick={onLoadMore}
                  className="w-full border-t border-border py-3 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted/30 hover:text-foreground disabled:opacity-50"
                >
                  {isLoadingMore ? "Loading…" : `Load ${DISPLAY_PAGE_SIZE} more`}
                </button>
              ) : (
                <div className="border-t border-border py-3 text-center text-[11.5px] text-muted-foreground/50">
                  All vacancies loaded
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <PreviewDetailPane
        entry={detailEntry}
        saveState={detailSaveState}
        isIgnored={detailIsIgnored}
        savingKey={savingKey}
        ignoringKey={ignoringKey}
        onSave={onSave}
        onIgnore={onIgnore}
      />
    </div>
  );
}

// ─── MatchesPage ─────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const { t } = useTranslation();
  const vm = useMatchesPageController();
  const { loopsQ } = vm.queries;

  const [allEntries, setAllEntries] = useState<DiscoveryPageEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [saveStates, setSaveStates] = useState<Record<string, MatchesDiscoverySaveState>>({});
  const [ignoredKeys, setIgnoredKeys] = useState<Set<string>>(new Set());
  const [sourceHasMore, setSourceHasMore] = useState<Record<string, boolean>>({});
  const [backendPage, setBackendPage] = useState(1);
  const [displayCount, setDisplayCount] = useState(DISPLAY_PAGE_SIZE);

  const [activeSource, setActiveSource] = useState("all");
  const [activeStatus, setActiveStatus] = useState<DiscoveryStatusTab>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [ignoringKey, setIgnoringKey] = useState<string | null>(null);

  const activeLoops = useMemo(
    () => vm.loops.filter((l) => l.status !== "archived"),
    [vm.loops],
  );

  const loopOptions = useMemo(
    () => getMatchesDiscoveryLoopOptions(activeLoops),
    [activeLoops],
  );

  const loopIds = useMemo(
    () => activeLoops.map((l) => l.id),
    [activeLoops],
  );

  const loopKey = loopIds.join(",");

  useEffect(() => {
    if (loopsQ.isLoading) return;

    let cancelled = false;
    void (async () => {
      if (loopOptions.length === 0) {
        setAllEntries([]);
        setIgnoredKeys(new Set());
        setSourceHasMore({});
        setBackendPage(1);
        setDisplayCount(DISPLAY_PAGE_SIZE);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      setAllEntries([]);
      setSourceHasMore({});
      setBackendPage(1);
      setDisplayCount(DISPLAY_PAGE_SIZE);

      try {
        const { entries, ignoredKeys: keys, sourceHasMore: hm } =
          await loadDiscoveryPage1(loopOptions, loopIds);
        if (cancelled) return;
        setAllEntries(entries);
        setIgnoredKeys(keys);
        setSourceHasMore(hm);
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => { cancelled = true; };
  // loopOptions/loopIds are stable memos derived from loopKey; listing loopKey avoids stale closure
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loopsQ.isLoading, loopKey, reloadKey]);

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of allEntries) {
      counts.set(entry.sourceId, (counts.get(entry.sourceId) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => ({
      key, label: getRunnableDiscoverySourceLabel(key), count,
    }));
  }, [allEntries]);

  const filteredAll = useMemo(
    () => allEntries.filter((entry) => {
      if (activeSource !== "all" && entry.sourceId !== activeSource) return false;
      const saveState = saveStates[entry.key] ?? "idle";
      const isIgnored = ignoredKeys.has(entry.stableKey);
      if (activeStatus === "hidden") return isIgnored;
      if (isIgnored) return false;
      if (activeStatus === "new") return !isMatchesDiscoverySavedState(saveState);
      if (activeStatus === "saved") return isMatchesDiscoverySavedState(saveState);
      return true;
    }),
    [allEntries, activeSource, activeStatus, saveStates, ignoredKeys],
  );

  const filtered = useMemo(
    () => filteredAll.slice(0, displayCount),
    [filteredAll, displayCount],
  );

  const anyHasMore = useMemo(
    () => Object.values(sourceHasMore).some(Boolean),
    [sourceHasMore],
  );

  const canLoadMore = displayCount < filteredAll.length || anyHasMore;

  const statusCounts = useMemo((): Record<DiscoveryStatusTab, number> => {
    const base = activeSource === "all"
      ? allEntries
      : allEntries.filter((e) => e.sourceId === activeSource);

    let all = 0;
    let newCount = 0;
    let savedCount = 0;
    let hiddenCount = 0;

    for (const entry of base) {
      const saveState = saveStates[entry.key] ?? "idle";
      const isIgnored = ignoredKeys.has(entry.stableKey);
      if (isIgnored) { hiddenCount++; continue; }
      all++;
      if (isMatchesDiscoverySavedState(saveState)) savedCount++;
      else newCount++;
    }

    return { all, new: newCount, saved: savedCount, hidden: hiddenCount };
  }, [allEntries, activeSource, saveStates, ignoredKeys]);

  const selectedEntry = useMemo(
    () => filtered.find((e) => e.key === selectedKey) ?? null,
    [filtered, selectedKey],
  );

  function handleSetSource(src: string) {
    setActiveSource(src);
    setDisplayCount(DISPLAY_PAGE_SIZE);
  }

  function handleSetStatus(status: DiscoveryStatusTab) {
    setActiveStatus(status);
    setDisplayCount(DISPLAY_PAGE_SIZE);
  }

  async function handleLoadMore() {
    if (displayCount < filteredAll.length) {
      setDisplayCount((c) => c + DISPLAY_PAGE_SIZE);
      return;
    }
    if (!anyHasMore) return;

    const nextPage = backendPage + 1;
    setIsLoadingMore(true);
    try {
      const { entries: newEntries, nextHasMore } = await loadDiscoveryNextPage(
        loopOptions,
        sourceHasMore,
        nextPage,
      );
      setAllEntries((prev) =>
        dedupeMatchesDiscoveryPreviewEntries([...prev, ...newEntries]),
      );
      setSourceHasMore(nextHasMore);
      setBackendPage(nextPage);
      setDisplayCount((c) => c + DISPLAY_PAGE_SIZE);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoadingMore(false);
    }
  }

  async function handleSave(entry: DiscoveryPageEntry) {
    setSavingKey(entry.key);
    setSaveStates((prev) => ({ ...prev, [entry.key]: "saving" }));
    try {
      const result = await saveDiscoveryPreviewAsApplicationViaRest(entry.loopId, {
        sourceId: entry.sourceId,
        externalId: entry.item.externalId,
        sourceUrl: entry.item.sourceUrl,
        title: entry.item.title,
        company: entry.item.company,
        location: entry.item.location,
        description: entry.item.snippet,
        postedAt: entry.item.postedAt,
        rawMetadata: entry.item.rawMetadata,
        confidence: entry.item.confidence,
      });
      const nextState: MatchesDiscoverySaveState = result.duplicate ? "duplicate" : "saved";
      setSaveStates((prev) => ({ ...prev, [entry.key]: nextState }));
    } catch (err: unknown) {
      setSaveStates((prev) => ({ ...prev, [entry.key]: "idle" }));
      setError(getErrorMessage(err));
    } finally {
      setSavingKey(null);
    }
  }

  async function handleIgnore(entry: DiscoveryPageEntry) {
    setIgnoringKey(entry.key);
    try {
      await ignoreDiscoveryPreviewViaRest(entry.loopId, {
        sourceId: entry.sourceId,
        externalId: entry.item.externalId,
        sourceUrl: entry.item.sourceUrl,
        title: entry.item.title,
        company: entry.item.company,
      });
      setIgnoredKeys((prev) => new Set([...prev, entry.stableKey]));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIgnoringKey(null);
    }
  }

  const totalLoaded = allEntries.length;
  const title = t("matches.list.title", "Matches");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-muted-foreground/60 mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span>{title}</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {title}
            </h1>
            {!isLoading && totalLoaded > 0 ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {totalLoaded}{anyHasMore ? "+" : ""} vacancies · {sources.length} source{sources.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {MATCHES_DISCOVERY_COPY.runButton}
          </button>
        </div>
      </div>

      <SourcesStrip
        sources={sources}
        totalCount={totalLoaded}
        activeSource={activeSource}
        onSetSource={handleSetSource}
      />

      <StatusTabBar
        counts={statusCounts}
        activeStatus={activeStatus}
        onSetStatus={handleSetStatus}
      />

      {error ? (
        <div className="shrink-0 mx-7 mt-3 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
          {error}
        </div>
      ) : null}

      <div className="flex-1 min-h-0 overflow-hidden bg-background p-6">
        <MatchesBody
          isLoading={isLoading}
          allEntries={allEntries}
          filteredAll={filteredAll}
          filtered={filtered}
          selectedEntry={selectedEntry}
          saveStates={saveStates}
          ignoredKeys={ignoredKeys}
          savingKey={savingKey}
          ignoringKey={ignoringKey}
          canLoadMore={canLoadMore}
          isLoadingMore={isLoadingMore}
          onSelectKey={setSelectedKey}
          onSave={(entry) => { void handleSave(entry); }}
          onIgnore={(entry) => { void handleIgnore(entry); }}
          onLoadMore={() => { void handleLoadMore(); }}
        />
      </div>
    </div>
  );
}
