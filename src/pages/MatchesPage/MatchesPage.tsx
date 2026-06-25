import { useCallback, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { useBackendLoopsQuery } from "src/features/loops";

import { MatchesDetailPanel } from "./components/MatchesDetailPanel";
import { MatchesEmptyState } from "./components/MatchesEmptyState";
import { MatchesHeader } from "./components/MatchesHeader";
import { MatchesListPanel } from "./components/MatchesListPanel";
import { MatchesSourcesStrip } from "./components/MatchesSourcesStrip";
import { MatchesTabs } from "./components/MatchesTabs";
import { MatchesToolbar } from "./components/MatchesToolbar";
import {
  isLoopVisibleInMatches,
  parsePageParam,
  parseSort,
  parseTab,
  type SortKey,
  type StatusTab,
} from "./components/matchesV2.helpers";
import { useMatchesFeed, type MatchesFeed } from "./components/useMatchesFeed";

type LoopsQueryData = Loop[] | { items?: Loop[] } | undefined;

function readLoopsFromQuery(data: LoopsQueryData): Loop[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
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

  const feed = useMatchesFeed({ tab, searchQuery, sourceParam, sort, page, loops });

  // Snap an out-of-range page back into bounds once the total is known.
  useEffect(() => {
    if (page > feed.totalPages) {
      updateParam({ page: feed.totalPages === 1 ? null : String(feed.totalPages) });
    }
  }, [page, feed.totalPages, updateParam]);

  const handleStatusChange = (next: StatusTab) =>
    updateParam({ status: next === "all" ? null : next, page: null });
  const handleSourceChange = (next: string) =>
    updateParam({ source: next || null, page: null });
  const handleSortChange = (next: SortKey) =>
    updateParam({ sort: next === "posted" ? null : next, page: null });
  const handleSearchChange = (value: string) =>
    updateParam({ q: value || null, page: null });
  const handlePageChange = (next: number) =>
    updateParam({ page: next === 1 ? null : String(next) });

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <MatchesHeader
        fromLoopId={fromLoopId}
        isLoadingLoops={loopsQ.isLoading}
        countAll={feed.counts.all}
        loopsCount={loops.length}
        isLoading={feed.isLoading}
        isRefreshing={feed.isRefreshing}
        onRefresh={() => void feed.handleRefresh()}
        onBackToLoop={() => navigate(`/dashboard/loops/${fromLoopId}`)}
      />

      <MatchesSourcesStrip
        buckets={feed.sourceBuckets}
        totalCount={feed.counts.all}
        activeSource={sourceParam}
        onChange={handleSourceChange}
      />

      <div className="flex shrink-0 flex-wrap items-end justify-between gap-3 border-b border-border bg-background px-7 pt-2.5">
        <MatchesTabs tab={tab} counts={feed.counts} onChange={handleStatusChange} />
        <MatchesToolbar
          searchQuery={searchQuery}
          onSearchChange={handleSearchChange}
          sort={sort}
          onSortChange={handleSortChange}
        />
      </div>

      <main className="min-h-0 flex-1 overflow-hidden px-7 py-4">
        <MatchesMainContent
          isLoadingLoops={loopsQ.isLoading}
          loopsCount={loops.length}
          feed={feed}
          onPageChange={handlePageChange}
        />
      </main>
    </div>
  );
}

function MatchesMainContent({
  isLoadingLoops,
  loopsCount,
  feed,
  onPageChange,
}: {
  isLoadingLoops: boolean;
  loopsCount: number;
  feed: MatchesFeed;
  onPageChange: (next: number) => void;
}) {
  if (isLoadingLoops) return <MatchesEmptyState kind="loops-loading" />;
  if (loopsCount === 0) return <MatchesEmptyState kind="no-loops" />;

  return (
    <>
      {feed.error ? (
        <div className="mb-3 rounded-[10px] border border-destructive/30 bg-destructive/5 px-3 py-2 text-[12.5px] text-destructive">
          {feed.error}
        </div>
      ) : null}
      <div className="grid h-full min-h-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <MatchesListPanel
          items={feed.items}
          totalCount={feed.total}
          activeMatchId={feed.activeMatchId}
          onSelect={feed.handleSelect}
          isLoading={feed.isLoading}
          page={feed.safePage}
          totalPages={feed.totalPages}
          onPageChange={onPageChange}
          nextRunAt={feed.nextRunAt}
          onAutoRefresh={feed.triggerReload}
        />
        <MatchesDetailPanel
          item={feed.activeItem}
          isConverting={feed.activeItem ? feed.convertingId === feed.activeItem.match.id : false}
          isSaving={feed.activeItem ? feed.savingId === feed.activeItem.match.id : false}
          onConvert={(match) => void feed.handleConvert(match)}
          onSave={(match) => void feed.handleSave(match)}
          onOpenDetails={feed.handleOpenDetails}
        />
      </div>
    </>
  );
}
