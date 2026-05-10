import { skipToken } from "@reduxjs/toolkit/query";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { CreateLoopModal } from "src/entities/loop";
import {
  useGetLoopsPageQuery,
  useLazyGetLoopsPageQuery,
} from "src/entities/loop/api/loopApi";
import { joinTitles } from "src/entities/loop/lib/format";
import {
  setLastLoopsUrl,
  setLoopsListPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage, clampPage} from "src/shared/lib";
import { Button, Pagination } from "src/shared/ui";

const PAGE_SIZE = 7;

type CursorMap = Record<number, string | null | undefined>; // page -> cursorId


function readPageParam(search: string): number | null {
  const sp = new URLSearchParams(search);
  const raw = sp.get("page");
  if (!raw) return null;
  const n = Number(raw);
  return clampPage(n);
}

function writePageToSearch(search: string, page: number): string {
  const sp = new URLSearchParams(search);
  sp.set("page", String(clampPage(page)));
  const s = sp.toString();
  return s ? `?${s}` : "";
}

// ─── Stat tile (matches StatCard style) ──────────────────────────────────────

type StatTileProps = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
  green?: boolean;
};

function StatTile({ label, value, sub, accent, green }: StatTileProps) {
  const valueClass = accent
    ? "text-primary"
    : green
    ? "text-emerald-600"
    : "text-foreground";

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground truncate">
        {label}
      </div>
      <div
        className={`text-[28px] font-semibold tracking-[-0.025em] mt-2 tabular-nums leading-none ${valueClass}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="text-[11.5px] text-subtle-foreground mt-1">{sub}</div>
      ) : null}
    </div>
  );
}

// ─── Loop card ────────────────────────────────────────────────────────────────

type LoopCardItem = {
  id: string;
  name: string;
  location: string;
  titles: string[];
  remoteMode: string;
  radiusKm: number;
  platforms: string[];
  // stats are stubs — Loop model has no counters yet
  matchCount?: number;
  appliedCount?: number;
  todayCount?: number;
};

type LoopCardProps = {
  loop: LoopCardItem;
  onOpen: (id: string) => void;
};

function LoopCard({ loop, onOpen }: LoopCardProps) {
  const { t } = useTranslation();

  const titlesText = joinTitles(loop.titles) || t("loops.dash", "—");
  const remoteText =
    loop.remoteMode === "remote_only"
      ? t("loops.remoteOnly", "Remote")
      : t("loops.any", "Any");

  const matchCount = loop.matchCount ?? 0;
  const appliedCount = loop.appliedCount ?? 0;
  const todayCount = loop.todayCount ?? 0;

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onOpen(loop.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(loop.id);
        }
      }}
      className="rounded-[14px] border border-border bg-card p-5 hover:bg-muted transition-[background] duration-[120ms] cursor-pointer focus:outline-none focus:ring-2 focus:ring-border select-none"
    >
      <div className="grid grid-cols-[1fr_auto_auto] items-start gap-5">
        {/* Left: status pill + name + role */}
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {t("loops.active", "Active")}
            </span>
            {loop.platforms.length > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {loop.platforms.length} {loop.platforms.length === 1 ? t("loops.source", "source") : t("loops.sources", "sources")}
              </span>
            ) : null}
          </div>
          <div className="text-[15px] font-semibold text-foreground truncate leading-snug">
            {loop.name}
          </div>
          <div className="text-[12px] text-muted-foreground truncate mt-0.5">
            {titlesText}
          </div>
        </div>

        {/* Middle: parameter pills */}
        <div className="flex flex-col gap-1.5 min-w-0 pt-0.5">
          {loop.location ? (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
              {loop.location}
            </span>
          ) : null}
          {loop.radiusKm > 0 ? (
            <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
              {loop.radiusKm} km
            </span>
          ) : null}
          <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground whitespace-nowrap">
            {remoteText}
          </span>
        </div>

        {/* Right: stats + open button */}
        <div className="flex flex-col items-end gap-2 pt-0.5">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-bold tabular-nums leading-none text-foreground">
                {matchCount}
              </span>
              <span className="text-[10.5px] text-muted-foreground mt-0.5">
                {t("loops.statMatches", "Matches")}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-bold tabular-nums leading-none text-primary">
                {appliedCount}
              </span>
              <span className="text-[10.5px] text-muted-foreground mt-0.5">
                {t("loops.statApplied", "Applied")}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span
                className={`text-[18px] font-bold tabular-nums leading-none ${
                  todayCount > 0 ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                {todayCount}
              </span>
              <span className="text-[10.5px] text-muted-foreground mt-0.5">
                {t("loops.statToday", "Today")}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(loop.id); }}
            className="border border-border rounded-[6px] px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:bg-muted transition-colors"
          >
            {t("loops.open", "Open")} →
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── LoopsListView ────────────────────────────────────────────────────────────

export function LoopsListView({
  userId,
  onOpenLoop,
}: {
  userId: string;
  onOpenLoop: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();

  const savedListPage = useAppSelector((s) => s.loopsUi.listPage);

  const [createOpen, setCreateOpen] = useState(false);

  const page = useMemo(() => {
    const fromUrl = readPageParam(location.search);
    return fromUrl ?? clampPage(savedListPage);
  }, [location.search, savedListPage]);

  const cursorByPageRef = useRef<CursorMap>({ 1: null });

  const [cursorId, setCursorId] = useState<string | null>(null);

  const [fetchLoopsPage] = useLazyGetLoopsPageQuery();

  const syncCursorForPage = useCallback(
    async (targetPage: number) => {
      if (!userId) {
        setCursorId(null);
        return;
      }

      if (targetPage <= 1) {
        cursorByPageRef.current[1] = null;
        setCursorId(null);
        return;
      }

      const cache = cursorByPageRef.current;

      if (cache[targetPage] !== undefined) {
        setCursorId(cache[targetPage] ?? null);
        return;
      }

      if (cache[1] === undefined) cache[1] = null;

      for (let p = 1; p < targetPage; p += 1) {
        if (cache[p] === undefined) break;

        const cur = cache[p] ?? null;

        const res = await fetchLoopsPage({
          pageSize: PAGE_SIZE,
          cursorId: cur,
        }).unwrap();

        cache[p + 1] = res.nextCursor ?? null;

        if (!res.nextCursor) break;
      }

      setCursorId(cache[targetPage] ?? null);
    },
    [fetchLoopsPage, userId],
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        await syncCursorForPage(page);
      } catch {
        // cursorId как есть; ошибки loopsPageQ
      }
    };

    run().catch(() => {});

    return () => {
      cancelled = true;
      if (cancelled) return;
    };
  }, [page, syncCursorForPage]);

  const loopsPageQ = useGetLoopsPageQuery(
    userId ? { pageSize: PAGE_SIZE, cursorId } : skipToken,
  );

  const data = loopsPageQ.data;

  const items = useMemo(() => data?.items ?? [], [data]);
  const total = data?.total ?? 0;

  const nextCursor = loopsPageQ.data?.nextCursor ?? null;

  const totalPages = useMemo(() => {
    const n = Math.ceil(total / PAGE_SIZE);
    return n <= 0 ? 1 : n;
  }, [total]);


  useEffect(() => {
    if (!loopsPageQ.data) return;
    const nextPage = page + 1;

    const cache = cursorByPageRef.current;
    if (cache[nextPage] === undefined) {
      cache[nextPage] = nextCursor;
    }
  }, [loopsPageQ.data, page, nextCursor]);


  useEffect(() => {
    if (!loopsPageQ.data) return;
    const clamped = Math.max(1, Math.min(totalPages, page));
    if (clamped !== page) {
      const nextSearch = writePageToSearch(location.search, clamped);
      navigate(
        { pathname: location.pathname, search: nextSearch },
        { replace: true },
      );
    }
  }, [
    loopsPageQ.data,
    page,
    totalPages,
    navigate,
    location.pathname,
    location.search,
  ]);

  // ✅ sync Redux
  useEffect(() => {
    dispatch(setLoopsListPage(page));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, page, location.pathname, location.search]);

  const goToPage = useCallback(
    async (p: number) => {
      const next = clampPage(p);

      await syncCursorForPage(next);

      const nextSearch = writePageToSearch(location.search, next);
      navigate(
        { pathname: location.pathname, search: nextSearch },
        { replace: false },
      );
    },
    [navigate, location.pathname, location.search, syncCursorForPage],
  );

  const showFrom = useMemo(() => {
    if (total === 0) return 0;
    return (page - 1) * PAGE_SIZE + 1;
  }, [page, total]);

  const showTo = useMemo(() => {
    if (total === 0) return 0;
    return (page - 1) * PAGE_SIZE + items.length;
  }, [page, total, items.length]);

  // Aggregate stat tiles values from current page
  const totalMatches = useMemo(() => items.reduce((acc, l) => acc + ((l as LoopCardItem).matchCount ?? 0), 0), [items]);
  const totalApplied = useMemo(() => items.reduce((acc, l) => acc + ((l as LoopCardItem).appliedCount ?? 0), 0), [items]);
  const totalToday = useMemo(() => items.reduce((acc, l) => acc + ((l as LoopCardItem).todayCount ?? 0), 0), [items]);

  const content = useMemo(() => {
    if (loopsPageQ.isLoading) {
      return (
        <div className="text-sm text-muted-foreground">
          {t("loops.loading", "Loading…")}
        </div>
      );
    }

    if (loopsPageQ.isError) {
      return (
        <div className="text-sm text-muted-foreground">
          {getErrorMessage(loopsPageQ.error)}
        </div>
      );
    }

    if (total === 0) {
      return (
        <div className="text-sm text-muted-foreground">
          {t("loops.empty", "No loops yet. Create your first loop.")}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Stat tiles */}
        <div className="grid grid-cols-4 gap-4">
          <StatTile
            label={t("loops.statLoops", "Loops")}
            value={total}
            sub={t("loops.statLoopsSub", "Total active")}
          />
          <StatTile
            label={t("loops.statMatches", "Matches")}
            value={totalMatches}
            sub={t("loops.statMatchesSub", "Across all loops")}
          />
          <StatTile
            label={t("loops.statApplied", "Applied")}
            value={totalApplied}
            sub={t("loops.statAppliedSub", "Responded")}
            accent
          />
          <StatTile
            label={t("loops.statToday", "Today")}
            value={totalToday}
            sub={t("loops.statTodaySub", "New today")}
            green={totalToday > 0}
          />
        </div>

        {/* Loop cards */}
        <div className="space-y-3">
          {items.map((l) => (
            <LoopCard
              key={l.id}
              loop={l as LoopCardItem}
              onOpen={onOpenLoop}
            />
          ))}
        </div>

        <div className="grid grid-cols-3 items-center">
          <div className="text-xs text-muted-foreground">
            {t("loops.showing", "Showing {{from}}–{{to}} of {{total}}", {
              from: showFrom,
              to: showTo,
              total,
            })}
          </div>

          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={goToPage}
            disabled={loopsPageQ.isFetching}
            siblingCount={1}
          />
        </div>
      </div>
    );
  }, [
    loopsPageQ.isLoading,
    loopsPageQ.isError,
    loopsPageQ.error,
    loopsPageQ.isFetching,
    items,
    onOpenLoop,
    page,
    showFrom,
    showTo,
    t,
    total,
    totalPages,
    totalMatches,
    totalApplied,
    totalToday,
    goToPage,
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Page header */}
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">{t("loops.listTitle", "Loops")}</span>
            </div>
            <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
              {t("loops.listTitle", "My Loops")}
            </h1>
            {t("loops.listSubtitle") ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {t("loops.listSubtitle", "Create a loop and track matches.")}
              </p>
            ) : null}
          </div>
          <Button
            variant="default"
            shadow="sm"
            shape="lg"
            onClick={() => setCreateOpen(true)}
          >
            {t("loops.newLoop", "New loop")}
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7">
          {content}
        </div>
      </div>

      <CreateLoopModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => {
          cursorByPageRef.current = { 1: null };
          setCursorId(null);

          const nextSearch = writePageToSearch(location.search, 1);
          navigate(
            { pathname: location.pathname, search: nextSearch },
            { replace: true },
          );

          onOpenLoop(id);
        }}
      />
    </div>
  );
}
