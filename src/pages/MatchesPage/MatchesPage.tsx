import { ExternalLink, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { useBackendLoopsQuery } from "src/features/loops";
import {
  createApplicationFromVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  patchLoopVacancyMatchViaRest,
  type VacancyMatch,
  type VacancyMatchStatus,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import { getMatchesDiscoverySavedPreviewKey } from "./components/matchesDiscoveryPreview.helpers";
import { MatchesDiscoveryPreviewPanel } from "./components/MatchesDiscoveryPreviewPanel";
import { getApplicationDetailsRoute } from "./components/matchesSavedVacancyMatches.helpers";
import { matchesFiltersDefaults } from "./model/filters";

type StatusFilter = "all" | VacancyMatchStatus;
type SortFilter = "updated_desc" | "created_desc" | "score_desc" | "title_asc";

const PAGE_SIZE = 20;

const STATUS_OPTIONS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "saved", label: "Saved" },
  { value: "ignored", label: "Hidden" },
  { value: "converted", label: "Converted" },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: "updated_desc", label: "Recently updated" },
  { value: "created_desc", label: "Recently saved" },
  { value: "score_desc", label: "Best score" },
  { value: "title_asc", label: "Title A-Z" },
];

interface MatchWithLoop {
  loopName: string;
  match: VacancyMatch;
}

type LoopsQueryData = Loop[] | { items?: Loop[] } | undefined;

function getLoopsFromQueryData(data: LoopsQueryData): Loop[] {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
}

function getLoopName(loop: Loop): string {
  const displayName = loop.title || loop.name || loop.targetRole || loop.id;
  return [displayName, loop.targetRole, loop.location]
    .map((part) => String(part ?? "").trim())
    .filter((part, index, parts) => part && parts.indexOf(part) === index)
    .join(" - ") || loop.id;
}

function getScore(match: VacancyMatch): number | null {
  const raw = match.confidence?.score ?? match.confidence?.overall ?? match.confidence?.match;
  return typeof raw === "number" ? Math.round(raw) : null;
}

function getStatusLabel(status: VacancyMatchStatus): string {
  if (status === "new") return "New";
  if (status === "saved") return "Saved";
  if (status === "ignored") return "Hidden";
  return "Converted";
}

function getStatusClass(status: VacancyMatchStatus): string {
  if (status === "converted") return "bg-blue-100 text-blue-700";
  if (status === "ignored") return "bg-muted text-muted-foreground";
  if (status === "saved") return "bg-emerald-100 text-emerald-700";
  return "bg-primary/10 text-primary";
}

function getScoreClass(score: number): string {
  if (score >= 85) return "border-emerald-300 bg-emerald-50 text-emerald-700";
  if (score >= 70) return "border-amber-300 bg-amber-50 text-amber-700";
  return "border-border bg-muted text-muted-foreground";
}

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "").trim().toLowerCase();
}

function buildMatchDetailsRoute(match: VacancyMatch): string {
  return `/dashboard/matches/${encodeURIComponent(match.id)}?loopId=${encodeURIComponent(match.loopId)}`;
}

function filterAndSortMatches(
  items: readonly MatchWithLoop[],
  args: {
    q: string;
    source: string;
    status: StatusFilter;
    sort: SortFilter;
  },
): MatchWithLoop[] {
  const q = normalizeText(args.q);
  const source = normalizeText(args.source);
  const filtered = items.filter(({ match, loopName }) => {
    if (args.status !== "all" && match.status !== args.status) return false;
    if (source && normalizeText(match.source) !== source) return false;
    if (!q) return true;

    const haystack = [
      match.roleTitle,
      match.companyName,
      match.locationText,
      match.sourceUrl,
      match.vacancyDescription,
      loopName,
    ].map((part) => normalizeText(part)).join(" ");
    return haystack.includes(q);
  });

  return [...filtered].sort((left, right) => {
    if (args.sort === "title_asc") {
      return String(left.match.roleTitle ?? "").localeCompare(
        String(right.match.roleTitle ?? ""),
        undefined,
        { sensitivity: "base" },
      );
    }
    if (args.sort === "score_desc") {
      return (getScore(right.match) ?? -1) - (getScore(left.match) ?? -1);
    }
    if (args.sort === "created_desc") {
      return right.match.createdAt.localeCompare(left.match.createdAt);
    }
    return right.match.updatedAt.localeCompare(left.match.updatedAt);
  });
}

function MatchCard({
  item,
  convertingId,
  ignoringId,
  onConvert,
  onIgnore,
  onOpenDetails,
}: {
  item: MatchWithLoop;
  convertingId: string | null;
  ignoringId: string | null;
  onConvert: (match: VacancyMatch) => void;
  onIgnore: (match: VacancyMatch) => void;
  onOpenDetails: (match: VacancyMatch) => void;
}) {
  const { loopName, match } = item;
  const score = getScore(match);
  const canAct = match.status === "new" || match.status === "saved";

  return (
    <article className="rounded-[10px] border border-border bg-card p-4">
      <div className="flex items-start gap-3">
        {score !== null ? (
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] border text-[14px] font-semibold tabular-nums ${getScoreClass(score)}`}>
            {score}
          </div>
        ) : (
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[12px] text-muted-foreground">
            --
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenDetails(match)}
              className="min-w-0 truncate text-left text-[15px] font-semibold text-foreground hover:underline"
            >
              {match.roleTitle || "Untitled vacancy"}
            </button>
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${getStatusClass(match.status)}`}>
              {getStatusLabel(match.status)}
            </span>
          </div>
          <div className="mt-1 text-[12.5px] text-muted-foreground">
            {[match.companyName, match.locationText, match.source, loopName].filter(Boolean).join(" · ")}
          </div>
          {match.vacancyDescription ? (
            <p className="mt-2 line-clamp-2 text-[12.5px] leading-relaxed text-muted-foreground">
              {match.vacancyDescription}
            </p>
          ) : null}
          <a
            href={match.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex max-w-full items-center gap-1 truncate text-[12px] text-primary hover:underline"
          >
            <span className="truncate">{match.sourceUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0" />
          </a>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => onOpenDetails(match)}
          className="rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted"
        >
          Details
        </button>
        {canAct ? (
          <>
            <button
              type="button"
              disabled={convertingId === match.id}
              onClick={() => onConvert(match)}
              className="rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground disabled:opacity-50"
            >
              {convertingId === match.id ? "Creating..." : "Create Application"}
            </button>
            <button
              type="button"
              disabled={ignoringId === match.id}
              onClick={() => onIgnore(match)}
              className="rounded-md border border-border px-3 py-1.5 text-[12.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {ignoringId === match.id ? "Hiding..." : "Hide"}
            </button>
          </>
        ) : null}
        {match.applicationId ? (
          <a
            href={getApplicationDetailsRoute(match.applicationId)}
            className="rounded-md border border-border px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted"
          >
            Open Application
          </a>
        ) : null}
      </div>
    </article>
  );
}

export default function MatchesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const loopsQ = useBackendLoopsQuery({ includeArchived: false });
  const loops = useMemo(
    () =>
      getLoopsFromQueryData(loopsQ.data as LoopsQueryData).filter(
        (loop) => loop.status !== "archived",
      ),
    [loopsQ.data],
  );

  const [selectedLoopId, setSelectedLoopId] = useState(searchParams.get("loopId") ?? "");
  const [items, setItems] = useState<MatchWithLoop[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [source, setSource] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortFilter>("updated_desc");
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);

  const selectedLoop = useMemo(
    () => loops.find((loop) => loop.id === selectedLoopId) ?? null,
    [loops, selectedLoopId],
  );

  useEffect(() => {
    const loopId = searchParams.get("loopId") ?? "";
    if (loopId) {
      setSelectedLoopId(loopId);
      return;
    }

    if (selectedLoopId && loops.some((loop) => loop.id === selectedLoopId)) return;

    if (loops.length === 1) {
      const onlyLoopId = loops[0]?.id ?? "";
      if (!onlyLoopId) return;

      setSelectedLoopId(onlyLoopId);
      const next = new URLSearchParams(searchParams);
      next.set("loopId", onlyLoopId);
      setSearchParams(next, { replace: true });
      return;
    }

    if (selectedLoopId) setSelectedLoopId("");
  }, [loops, searchParams, selectedLoopId, setSearchParams]);

  const loadMatches = useCallback(async (nextOffset: number, append: boolean) => {
    if (!selectedLoop) {
      setItems([]);
      setTotal(0);
      setOffset(0);
      return;
    }

    if (append) setIsLoadingMore(true);
    else setIsLoading(true);
    setError(null);

    try {
      const response = await listLoopVacancyMatchesViaRest(selectedLoop.id, {
        status: status === "all" ? undefined : status,
        limit: PAGE_SIZE,
        offset: nextOffset,
      });
      const loaded = response.items.map((match) => ({
        loopName: getLoopName(selectedLoop),
        match,
      }));
      setItems((current) => append ? [...current, ...loaded] : loaded);
      setTotal(response.total);
      setOffset(nextOffset + response.items.length);
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError));
      if (!append) {
        setItems([]);
        setTotal(0);
        setOffset(0);
      }
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [selectedLoop, status]);

  useEffect(() => {
    void loadMatches(0, false);
  }, [loadMatches, reloadKey]);

  const sources = useMemo(() => {
    const values = new Set<string>();
    for (const { match } of items) {
      const normalized = normalizeText(match.source);
      if (normalized) values.add(normalized);
    }
    return [...values].sort();
  }, [items]);

  const visibleItems = useMemo(
    () => filterAndSortMatches(items, { q, source, status, sort }),
    [items, q, source, status, sort],
  );

  const savedPreviewKeys = useMemo(
    () => new Set(items.map(({ match }) =>
      getMatchesDiscoverySavedPreviewKey({
        loopId: match.loopId,
        sourceId: match.source,
        externalId: match.externalId,
        sourceUrl: match.sourceUrl,
      }),
    )),
    [items],
  );

  const discoveryFilters = useMemo(
    () => ({
      ...matchesFiltersDefaults,
      loopIds: selectedLoop ? [selectedLoop.id] : [],
    }),
    [selectedLoop],
  );

  function handleSelectLoop(loopId: string) {
    setSelectedLoopId(loopId);
    setItems([]);
    setTotal(0);
    setOffset(0);
    const next = new URLSearchParams(searchParams);
    if (loopId) next.set("loopId", loopId);
    else next.delete("loopId");
    setSearchParams(next, { replace: true });
  }

  async function handleConvert(match: VacancyMatch) {
    setConvertingId(match.id);
    setError(null);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(match.loopId, match.id);
      setItems((current) => current.map((item) =>
        item.match.id === match.id ? { ...item, match: result.match } : item,
      ));
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConvertingId(null);
    }
  }

  async function handleIgnore(match: VacancyMatch) {
    setIgnoringId(match.id);
    setError(null);
    try {
      const updated = await patchLoopVacancyMatchViaRest(match.loopId, match.id, { status: "ignored" });
      setItems((current) => current.map((item) =>
        item.match.id === match.id ? { ...item, match: updated } : item,
      ));
    } catch (ignoreError: unknown) {
      setError(getErrorMessage(ignoreError));
    } finally {
      setIgnoringId(null);
    }
  }

  const hasMore = offset < total;

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-7 py-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11.5px] text-muted-foreground/60">
              <span>Loopboard</span>
              <span>/</span>
              <span>Matches</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
              Matches
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              Discovery preview and saved vacancy matches for one search loop.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((key) => key + 1)}
            disabled={!selectedLoop || isLoading}
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
            Refresh saved
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[minmax(220px,320px)_1fr]">
          <label className="text-[12px] font-medium text-muted-foreground">
            Loop
            <select
              value={selectedLoopId}
              onChange={(event) => handleSelectLoop(event.target.value)}
              disabled={loopsQ.isLoading}
              className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
            >
              <option value="">Choose a Loop...</option>
              {loops.map((loop) => (
                <option key={loop.id} value={loop.id}>
                  {getLoopName(loop)}
                </option>
              ))}
            </select>
          </label>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="text-[12px] font-medium text-muted-foreground">
              Search
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Role, company, location..."
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
              />
            </label>
            <label className="text-[12px] font-medium text-muted-foreground">
              Source
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
              >
                <option value="">All sources</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-medium text-muted-foreground">
              Status
              <select
                value={status}
                onChange={(event) => setStatus(event.target.value as StatusFilter)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
            <label className="text-[12px] font-medium text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortFilter)}
                className="mt-1 h-9 w-full rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {loopsQ.isLoading ? (
          <div className="rounded-[12px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
            Loading loops...
          </div>
        ) : loops.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
            Create a Loop first, then come back here to run discovery and save vacancy matches.
          </div>
        ) : !selectedLoop ? (
          <div className="rounded-[12px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
            Choose a Loop to run discovery and view saved vacancy matches.
          </div>
        ) : (
          <>
            <MatchesDiscoveryPreviewPanel
              filters={discoveryFilters}
              loops={[selectedLoop]}
              loopsLoading={loopsQ.isLoading}
              savedPreviewKeys={savedPreviewKeys}
              onMatchSaved={() => {
                setReloadKey((key) => key + 1);
              }}
            />

            <section className="rounded-[14px] border border-border bg-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-[16px] font-semibold text-foreground">
                    Saved VacancyMatches
                  </h2>
                  <p className="mt-1 text-[12.5px] text-muted-foreground">
                    {visibleItems.length} shown from {total} saved matches.
                  </p>
                </div>
              </div>

              {error ? (
                <div className="mt-4 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
                  {error}
                </div>
              ) : null}

              {isLoading ? (
                <div className="mt-4 rounded-[10px] border border-border bg-background p-4 text-[12.5px] text-muted-foreground">
                  Loading saved matches...
                </div>
              ) : visibleItems.length === 0 ? (
                <div className="mt-4 rounded-[10px] border border-dashed border-border bg-background p-4 text-[12.5px] text-muted-foreground">
                  No saved vacancy matches for this Loop yet. Run discovery above and save interesting vacancies.
                </div>
              ) : (
                <div className="mt-4 grid gap-3">
                  {visibleItems.map((item) => (
                    <MatchCard
                      key={item.match.id}
                      item={item}
                      convertingId={convertingId}
                      ignoringId={ignoringId}
                      onConvert={(match) => { void handleConvert(match); }}
                      onIgnore={(match) => { void handleIgnore(match); }}
                      onOpenDetails={(match) => navigate(buildMatchDetailsRoute(match))}
                    />
                  ))}
                </div>
              )}

              {hasMore ? (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => { void loadMatches(offset, true); }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMore ? "animate-spin" : ""}`} />
                    {isLoadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
