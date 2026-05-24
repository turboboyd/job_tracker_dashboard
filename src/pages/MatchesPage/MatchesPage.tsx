import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
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

const STATUS_TABS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Все" },
  { value: "new", label: "Новые" },
  { value: "saved", label: "Сохранённые" },
  { value: "ignored", label: "Скрытые" },
  { value: "converted", label: "Отклики" },
];

const SORT_OPTIONS: Array<{ value: SortFilter; label: string }> = [
  { value: "updated_desc", label: "Недавно обновлённые" },
  { value: "created_desc", label: "Недавно сохранённые" },
  { value: "score_desc", label: "Лучший скор" },
  { value: "title_asc", label: "Название А-Я" },
];

const MATCH_STATUS_STYLES: Record<VacancyMatchStatus, { label: string; cls: string }> = {
  new: { label: "Новая", cls: "bg-primary/10 text-primary" },
  saved: { label: "Сохранено", cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" },
  ignored: { label: "Скрыто", cls: "bg-muted text-muted-foreground opacity-70" },
  converted: { label: "Отклик", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
};

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

function MatchRow({
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
  const { match } = item;
  const score = getScore(match);
  const canAct = match.status === "new" || match.status === "saved";
  const company = (match.companyName ?? "").trim() || "?";
  const avatar = company.charAt(0).toUpperCase();
  const statusStyle = MATCH_STATUS_STYLES[match.status];

  return (
    <div className="grid grid-cols-[32px_minmax(0,1fr)_100px_76px_auto] items-center gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[6px] bg-muted text-[12px] font-semibold text-muted-foreground">
        {avatar}
      </div>

      <div className="min-w-0">
        <button
          type="button"
          onClick={() => onOpenDetails(match)}
          className="block max-w-full truncate text-left text-[13.5px] font-medium text-foreground hover:underline"
        >
          {match.roleTitle || "Без названия"}
        </button>
        <div className="truncate text-[12px] text-muted-foreground">
          {[company !== "?" ? company : null, match.locationText].filter(Boolean).join(" · ")}
        </div>
      </div>

      <div className="truncate text-[11.5px] text-muted-foreground">
        {match.source || "—"}
      </div>

      <span className={`rounded-full px-2 py-0.5 text-center text-[11px] font-medium ${statusStyle.cls}`}>
        {statusStyle.label}
      </span>

      <div className="flex shrink-0 items-center gap-1.5">
        {score !== null ? (
          <div className={`flex h-7 w-10 items-center justify-center rounded-[5px] border text-[11.5px] font-semibold tabular-nums ${getScoreClass(score)}`}>
            {score}
          </div>
        ) : null}
        {canAct ? (
          <>
            <button
              type="button"
              disabled={convertingId === match.id}
              onClick={() => onConvert(match)}
              className="rounded-md bg-primary px-2.5 py-1 text-[11.5px] font-medium text-primary-foreground disabled:opacity-50"
            >
              {convertingId === match.id ? "…" : "Откликнуться"}
            </button>
            <button
              type="button"
              disabled={ignoringId === match.id}
              onClick={() => onIgnore(match)}
              className="rounded-md border border-border px-2.5 py-1 text-[11.5px] text-muted-foreground hover:bg-muted disabled:opacity-50"
            >
              {ignoringId === match.id ? "…" : "Скрыть"}
            </button>
          </>
        ) : null}
        {match.applicationId ? (
          <a
            href={getApplicationDetailsRoute(match.applicationId)}
            className="rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-muted"
          >
            Заявка
          </a>
        ) : null}
        <a
          href={match.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-border px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-muted"
        >
          Открыть
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
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

  const fromLoopId = searchParams.get("loopId");

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

  const loopFilters = selectedLoop?.filters as
    | { role?: string; location?: string; radiusKm?: number; workMode?: string }
    | undefined;

  const contextBadges = selectedLoop
    ? [
        loopFilters?.role ? { label: loopFilters.role } : null,
        loopFilters?.location ?? selectedLoop.location
          ? { label: loopFilters?.location ?? selectedLoop.location }
          : null,
        loopFilters?.radiusKm ? { label: `${loopFilters.radiusKm} km` } : null,
        loopFilters?.workMode && loopFilters.workMode !== "any"
          ? { label: loopFilters.workMode }
          : null,
      ].filter(Boolean as unknown as <T>(x: T | null) => x is T)
    : [];

  return (
    <div className="flex h-full flex-col overflow-hidden bg-background">
      <header className="shrink-0 border-b border-border px-7 pb-0 pt-5">
        <div className="flex flex-wrap items-start justify-between gap-4 pb-4">
          <div>
            {fromLoopId ? (
              <button
                type="button"
                onClick={() => navigate(`/dashboard/loops/${fromLoopId}`)}
                className="mb-2 inline-flex items-center gap-1.5 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Назад к циклу
              </button>
            ) : (
              <div className="mb-1 flex items-center gap-2 text-[11.5px] text-muted-foreground/60">
                <span>Loopboard</span>
                <span>/</span>
                <span>Матчи</span>
              </div>
            )}
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground">
              {selectedLoop ? getLoopName(selectedLoop) : "Матчи"}
            </h1>
            {contextBadges.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {contextBadges.map((badge) => (
                  <span
                    key={badge.label}
                    className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[11.5px] text-muted-foreground"
                  >
                    {badge.label}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-1 text-[13px] text-muted-foreground">
                Вакансии из поисковых циклов
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {loops.length > 1 ? (
              <select
                value={selectedLoopId}
                onChange={(event) => handleSelectLoop(event.target.value)}
                disabled={loopsQ.isLoading}
                className="h-9 rounded-md border border-border bg-background px-3 text-[13px] text-foreground"
              >
                <option value="">Выбрать цикл...</option>
                {loops.map((loop) => (
                  <option key={loop.id} value={loop.id}>
                    {getLoopName(loop)}
                  </option>
                ))}
              </select>
            ) : null}
            <button
              type="button"
              onClick={() => setReloadKey((key) => key + 1)}
              disabled={!selectedLoop || isLoading}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
              Обновить
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex gap-0.5">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.value}
                type="button"
                onClick={() => setStatus(tab.value)}
                className={[
                  "rounded-t-md px-3.5 py-2 text-[12.5px] font-medium transition-colors",
                  status === tab.value
                    ? "border-b-2 border-primary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 pb-1">
            <input
              value={q}
              onChange={(event) => setQ(event.target.value)}
              placeholder="Роль, компания..."
              className="h-8 w-48 rounded-md border border-border bg-background px-3 text-[12.5px] text-foreground placeholder:text-muted-foreground/60 focus:border-primary/60 focus:outline-none focus:ring-1 focus:ring-primary/20"
            />
            {sources.length > 0 ? (
              <select
                value={source}
                onChange={(event) => setSource(event.target.value)}
                className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px] text-foreground"
              >
                <option value="">Все источники</option>
                {sources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            ) : null}
            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as SortFilter)}
              className="h-8 rounded-md border border-border bg-background px-2 text-[12.5px] text-foreground"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto p-6">
        {loopsQ.isLoading ? (
          <div className="rounded-[12px] border border-border bg-card p-6 text-[13px] text-muted-foreground">
            Загрузка циклов...
          </div>
        ) : loops.length === 0 ? (
          <div className="rounded-[12px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
            Создайте цикл поиска, чтобы видеть матчи здесь.
          </div>
        ) : !selectedLoop ? (
          <div className="rounded-[12px] border border-dashed border-border bg-card p-6 text-[13px] text-muted-foreground">
            Выберите цикл, чтобы запустить поиск и просматривать матчи.
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

            <section className="overflow-hidden rounded-[14px] border border-border bg-card">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">
                    Сохранённые матчи
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-foreground">
                    {visibleItems.length} из {total}
                  </div>
                </div>
              </div>

              {error ? (
                <div className="mx-5 mt-4 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
                  {error}
                </div>
              ) : null}

              {isLoading ? (
                <div className="p-6 text-[13px] text-muted-foreground">
                  Загрузка матчей...
                </div>
              ) : visibleItems.length === 0 ? (
                <div className="p-6 text-[13px] text-muted-foreground">
                  Нет матчей по выбранным фильтрам. Запустите поиск выше, чтобы собрать вакансии.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {visibleItems.map((item) => (
                    <MatchRow
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
                <div className="flex justify-center border-t border-border p-4">
                  <button
                    type="button"
                    disabled={isLoadingMore}
                    onClick={() => { void loadMatches(offset, true); }}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-3 py-1.5 text-[12.5px] font-medium text-foreground hover:bg-muted disabled:opacity-50"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingMore ? "animate-spin" : ""}`} />
                    {isLoadingMore ? "Загрузка..." : "Загрузить ещё"}
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
