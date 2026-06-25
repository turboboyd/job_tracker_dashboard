import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { type Loop, CreateLoopModal } from "src/entities/loop";
import { createLoopViaRest } from "src/features/loops";
import {
  setLastLoopsUrl,
  setLoopsListPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { clampPage } from "src/shared/lib";
import { Pagination } from "src/shared/ui";

import { LoopCard } from "./LoopCard";
import { LoopEmptyState } from "./LoopEmptyState";
import { LoopListToolbar } from "./LoopListToolbar";
import {
  PAGE_SIZE,
  readPageParam,
  readTabParam,
  writeLoopsSearch,
  type LoopsTab,
} from "./loopListView.helpers";
import { LoopCardSkeleton } from "./LoopSkeleton";
import {
  filterLoopsByTab,
  getEffectiveStats,
  shouldShowLoopsPagination,
  type LoopStatsById,
} from "./loopsPage.helpers";
import { LoopStatsBar } from "./LoopStatsBar";
import { useLoopsListData } from "./useLoopsListData";

export function LoopsListView({
  userId,
  onOpenLoop,
}: {
  userId: string;
  onOpenLoop: (id: string) => void;
  onOpenApplications: (id: string) => void;
  onOpenMatches: (id: string) => void;
  onAddApplication: (id: string) => void;
  onImportVacancy: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const savedListPage = useAppSelector((state) => state.loopsUi.listPage);

  const [createOpen, setCreateOpen] = useState(false);
  const {
    loops,
    isLoadingLoops,
    isLoadingApplications,
    loopsError,
    statsError,
    statsLoops,
    statsById,
    activeTotals,
    reloadLoops,
  } = useLoopsListData(userId);

  const activeTab = readTabParam(location.search);
  const page = useMemo(() => {
    const fromUrl = readPageParam(location.search);
    return fromUrl ?? clampPage(savedListPage);
  }, [location.search, savedListPage]);

  const visibleLoops = useMemo(
    () => filterLoopsByTab(loops, activeTab),
    [activeTab, loops],
  );
  const totalPages = Math.max(1, Math.ceil(visibleLoops.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedLoops = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return visibleLoops.slice(start, start + PAGE_SIZE);
  }, [safePage, visibleLoops]);

  useEffect(() => {
    const clamped = Math.max(1, Math.min(totalPages, page));
    if (clamped === page) return;

    navigate(
      {
        pathname: location.pathname,
        search: writeLoopsSearch(location.search, { page: clamped }),
      },
      { replace: true },
    );
  }, [location.pathname, location.search, navigate, page, totalPages]);

  useEffect(() => {
    dispatch(setLoopsListPage(safePage));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, location.pathname, location.search, safePage]);

  const setTab = useCallback(
    (tab: LoopsTab) => {
      navigate(
        {
          pathname: location.pathname,
          search: writeLoopsSearch(location.search, { page: 1, tab }),
        },
        { replace: false },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const goToPage = useCallback(
    (nextPage: number) => {
      navigate(
        {
          pathname: location.pathname,
          search: writeLoopsSearch(location.search, { page: nextPage }),
        },
        { replace: false },
      );
    },
    [location.pathname, location.search, navigate],
  );

  const showFrom =
    visibleLoops.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showTo =
    visibleLoops.length === 0 ? 0 : showFrom + pagedLoops.length - 1;
  const isLoading = isLoadingLoops || isLoadingApplications;
  const isFetching = isLoadingLoops;
  const error = loopsError ?? statsError;

  const content = renderContent({
    activeTab,
    error,
    isFetching,
    isLoading,
    onOpenLoop,
    onPageChange: goToPage,
    onCreateLoop: () => setCreateOpen(true),
    page: safePage,
    pagedLoops,
    showFrom,
    showTo,
    statsById,
    t,
    total: visibleLoops.length,
    totalPages,
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <LoopListToolbar
        activeTab={activeTab}
        onTabChange={setTab}
        onNewLoop={() => setCreateOpen(true)}
      />

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="space-y-4 p-7">
          <LoopStatsBar statsLoops={statsLoops} activeTotals={activeTotals} />
          {content}
        </div>
      </div>

      <CreateLoopModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateLoop={createLoopViaRest}
        onCreated={(id) => {
          void reloadLoops();
          navigate(
            {
              pathname: location.pathname,
              search: writeLoopsSearch(location.search, {
                page: 1,
                tab: "active",
              }),
            },
            { replace: true },
          );
          onOpenLoop(id);
        }}
      />
    </div>
  );
}

function renderContent(params: {
  activeTab: LoopsTab;
  error: string | null;
  isFetching: boolean;
  isLoading: boolean;
  onCreateLoop: () => void;
  onOpenLoop: (id: string) => void;
  onPageChange: (nextPage: number) => void;
  page: number;
  pagedLoops: Loop[];
  showFrom: number;
  showTo: number;
  statsById: LoopStatsById;
  t: ReturnType<typeof useTranslation>["t"];
  total: number;
  totalPages: number;
}) {
  const {
    activeTab,
    error,
    isFetching,
    isLoading,
    onCreateLoop,
    onOpenLoop,
    onPageChange,
    page,
    pagedLoops,
    showFrom,
    showTo,
    statsById,
    t,
    total,
    totalPages,
  } = params;

  if (isLoading) {
    return (
      <div className="space-y-3">
        <LoopCardSkeleton />
        <LoopCardSkeleton />
        <LoopCardSkeleton />
      </div>
    );
  }

  if (error) {
    return <div className="text-sm text-muted-foreground">{error}</div>;
  }

  if (total === 0) {
    return <LoopEmptyState activeTab={activeTab} onCreateLoop={onCreateLoop} />;
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {pagedLoops.map((loop) => (
          <LoopCard
            key={loop.id}
            loop={loop}
            stats={getEffectiveStats(statsById, loop)}
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
        {shouldShowLoopsPagination(total, PAGE_SIZE) ? (
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={onPageChange}
            disabled={isFetching}
            siblingCount={1}
          />
        ) : (
          <div />
        )}
      </div>
    </div>
  );
}
