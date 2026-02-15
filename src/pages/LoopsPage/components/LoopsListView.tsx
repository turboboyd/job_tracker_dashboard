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
import { Button, Pagination, PageHeader } from "src/shared/ui";

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
        <div className="space-y-3">
          {items.map((l) => {
            const titlesText = joinTitles(l.titles) || t("loops.dash", "—");
            const remoteText =
              l.remoteMode === "remote_only"
                ? t("loops.remoteOnly", "Remote")
                : t("loops.any", "Any");

            return (
              <div
                key={l.id}
                tabIndex={0}
                onClick={() => onOpenLoop(l.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onOpenLoop(l.id);
                  }
                }}
                className={[
                  "w-full",
                  "rounded-xl border border-border bg-background",
                  "px-4 py-4",
                  "hover:bg-muted transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-border",
                  "cursor-pointer",
                  "select-none",
                ].join(" ")}
              >
                <div className="text-sm font-semibold text-foreground">
                  {l.name}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {l.location} · {titlesText} · {remoteText}
                </div>
              </div>
            );
          })}
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
    goToPage,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("loops.listTitle", "My Loops")}
        subtitle={t("loops.listSubtitle", "Create a loop and track matches.")}
        right={
          <Button
            variant="default"
            shadow="sm"
            shape="lg"
            onClick={() => setCreateOpen(true)}
          >
            {t("loops.newLoop", "New loop")}
          </Button>
        }
      />

      <div className="rounded-2xl border border-border bg-card p-6">
        {content}
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
