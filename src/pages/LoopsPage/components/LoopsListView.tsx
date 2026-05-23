import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { type Loop, CreateLoopModal } from "src/entities/loop";
import { joinTitles } from "src/entities/loop/lib/format";
import { listApplicationsViaRest } from "src/features/applications/rest/queries";
import {
  archiveLoopViaRest,
  createLoopViaRest,
  listLoopsViaRest,
  updateLoopViaRest,
} from "src/features/loops";
import { listLoopVacancyMatchesViaRest, type VacancyMatch } from "src/features/vacancyMatches";
import type { AppRow } from "src/pages/ApplicationsPage/model/types";
import {
  setLastLoopsUrl,
  setLoopsListPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { clampPage, getErrorMessage } from "src/shared/lib";
import { Button, Pagination } from "src/shared/ui";

import {
  buildLoopStatsById,
  countLoopStats,
  filterLoopsByTab,
  getEffectiveStats,
  getLoopStatus,
  getBackendLoopIdsForMatchLoading,
  isLoopPaused,
  shouldShowLoopsPagination,
  type LoopStats,
} from "./loopsPage.helpers";

const PAGE_SIZE = 10;
const APPLICATIONS_PAGE_SIZE = 100;

type LoopsTab = "active" | "paused" | "archive";

type StatTileProps = {
  label: string;
  value: number | string;
  sub?: string;
  accent?: boolean;
  green?: boolean;
};

function readPageParam(search: string): number | null {
  const sp = new URLSearchParams(search);
  const raw = sp.get("page");
  if (!raw) return null;

  return clampPage(Number(raw));
}

function readTabParam(search: string): LoopsTab {
  const tab = new URLSearchParams(search).get("tab");
  if (tab === "archive") return "archive";
  if (tab === "paused") return "paused";
  return "active";
}

function writeLoopsSearch(
  search: string,
  patch: { page?: number; tab?: LoopsTab },
): string {
  const sp = new URLSearchParams(search);
  if (patch.page !== undefined) sp.set("page", String(clampPage(patch.page)));
  if (patch.tab !== undefined) {
    if (patch.tab === "archive") sp.set("tab", "archive");
    else if (patch.tab === "paused") sp.set("tab", "paused");
    else sp.delete("tab");
  }

  const next = sp.toString();
  return next ? `?${next}` : "";
}

function getMetricValueClass(params: { accent?: boolean; green?: boolean }): string {
  if (params.accent) return "text-primary";
  if (params.green) return "text-emerald-600";
  return "text-foreground";
}

function StatTile({ label, value, sub, accent, green }: StatTileProps) {
  const valueClass = getMetricValueClass({ accent, green });

  return (
    <div className="rounded-[14px] border border-border bg-card p-[18px]">
      <div className="truncate text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
        {label}
      </div>
      <div
        className={`mt-2 text-[28px] font-semibold leading-none tracking-[-0.025em] tabular-nums ${valueClass}`}
      >
        {value}
      </div>
      {sub ? (
        <div className="mt-1 text-[11.5px] text-subtle-foreground">{sub}</div>
      ) : null}
    </div>
  );
}

function getLoopStatusClassName(status: ReturnType<typeof getLoopStatus>): string {
  if (status === "archived") return "bg-muted text-muted-foreground";
  if (status === "paused") {
    return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  }
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

function getLoopStatusLabel(
  status: ReturnType<typeof getLoopStatus>,
  t: ReturnType<typeof useTranslation>["t"],
): string {
  if (status === "archived") return t("loops.archived", "Archived");
  if (status === "paused") return t("loops.paused", "Paused");
  return t("loops.active", "Active");
}

function LoopStatusBadge({ loop }: { loop: Loop }) {
  const { t } = useTranslation();
  const status = getLoopStatus(loop);
  const className = getLoopStatusClassName(status);
  const label = getLoopStatusLabel(status, t);

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${className}`}
    >
      {label}
    </span>
  );
}

type LoopCardProps = {
  loop: Loop;
  stats: LoopStats;
  busy: boolean;
  onArchive: (id: string) => void;
  onOpen: (id: string) => void;
  onOpenApplications: (id: string) => void;
  onOpenMatches: (id: string) => void;
  onAddApplication: (id: string) => void;
  onImportVacancy: (id: string) => void;
  onRestore: (id: string) => void;
  onTogglePause: (loop: Loop) => void;
};

function LoopCard({
  loop,
  stats,
  busy,
  onArchive,
  onOpen,
  onOpenApplications: _onOpenApplications,
  onOpenMatches,
  onAddApplication: _onAddApplication,
  onImportVacancy: _onImportVacancy,
  onRestore,
  onTogglePause,
}: LoopCardProps) {
  const { t } = useTranslation();
  const titlesText =
    joinTitles(Array.isArray(loop.titles) ? loop.titles : []) ||
    t("loops.dash", "—");
  let remoteText = t("loops.any", "Any");
  if (loop.remoteMode === "remote_only") {
    remoteText = t("loops.remoteOnly", "Remote");
  }
  const archived = getLoopStatus(loop) === "archived";
  let sourceLabel = t("loops.sources", "sources");
  if (loop.platforms.length === 1) {
    sourceLabel = t("loops.source", "source");
  }

  return (
    <div
      tabIndex={0}
      role="button"
      onClick={() => onOpen(loop.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(loop.id);
        }
      }}
      className="cursor-pointer select-none rounded-[14px] border border-border bg-card p-5 transition-[background] duration-[120ms] hover:bg-muted focus:outline-none focus:ring-2 focus:ring-border"
    >
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-6">
        {/* Col 1: status + name + role */}
        <div className="min-w-0">
          <div className="mb-1.5 flex items-center gap-2">
            <LoopStatusBadge loop={loop} />
            {loop.platforms.length > 0 ? (
              <span className="text-[11px] text-muted-foreground">
                {loop.platforms.length} {sourceLabel}
              </span>
            ) : null}
          </div>
          <div className="truncate text-[15px] font-semibold leading-snug text-foreground">
            {loop.name}
          </div>
          <div className="mt-0.5 truncate text-[12px] text-muted-foreground">
            {titlesText}
          </div>
        </div>

        {/* Col 2: location tags */}
        <div className="flex min-w-0 flex-wrap gap-1.5">
          {loop.location ? (
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {loop.location}
            </span>
          ) : null}
          {loop.radiusKm > 0 ? (
            <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
              {loop.radiusKm} km
            </span>
          ) : null}
          <span className="inline-flex items-center whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
            {remoteText}
          </span>
        </div>

        {/* Col 3: metrics + actions */}
        <div className="flex flex-col items-end gap-3">
          {/* 2 key metrics */}
          <div className="flex items-start gap-5">
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-semibold leading-none tabular-nums text-foreground">
                {stats.matches}
              </span>
              <span className="mt-0.5 text-[10.5px] text-muted-foreground">
                {t("loops.statMatches", "Matches")}
              </span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-[18px] font-semibold leading-none tabular-nums text-primary">
                {stats.applications}
              </span>
              <span className="mt-0.5 text-[10.5px] text-muted-foreground">
                {t("loops.statApplications", "Applications")}
              </span>
            </div>
          </div>

          {/* Primary actions */}
          <div className="flex flex-wrap justify-end gap-1.5">
            <LoopActionButton variant="primary" onClick={() => onOpenMatches(loop.id)}>
              {t("loops.statMatches", "Matches")}
            </LoopActionButton>
            {!archived ? (
              <LoopActionButton
                variant="secondary"
                disabled={busy}
                onClick={() => onTogglePause(loop)}
              >
                {getPauseActionLabel(loop)}
              </LoopActionButton>
            ) : null}
            {archived ? (
              <LoopActionButton
                variant="secondary"
                disabled={busy}
                onClick={() => onRestore(loop.id)}
              >
                Restore
              </LoopActionButton>
            ) : null}
            {!archived ? (
              <LoopActionButton
                variant="ghost"
                disabled={busy}
                onClick={() => onArchive(loop.id)}
              >
                Archive
              </LoopActionButton>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}


function getPauseActionLabel(loop: Loop): string {
  if (isLoopPaused(loop)) return "Resume";
  return "Pause";
}

const LOOP_ACTION_CLASS: Record<"primary" | "secondary" | "ghost", string> = {
  primary:
    "border border-primary bg-primary text-primary-foreground hover:opacity-90",
  secondary:
    "border border-border bg-card text-foreground hover:bg-muted",
  ghost:
    "border border-transparent text-muted-foreground hover:text-destructive hover:bg-destructive/10",
};

function LoopActionButton({
  children,
  disabled,
  onClick,
  variant = "secondary",
}: {
  children: string;
  disabled?: boolean;
  onClick: () => void;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className={[
        "rounded-[6px] px-2.5 py-1.5 text-[11.5px] transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        LOOP_ACTION_CLASS[variant],
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function LoopsListView({
  userId,
  onOpenLoop,
  onOpenApplications,
  onOpenMatches,
  onAddApplication,
  onImportVacancy,
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
  const [applications, setApplications] = useState<AppRow[]>([]);
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [statsError, setStatsError] = useState<string | null>(null);
  const [isLoadingApplications, setIsLoadingApplications] = useState(false);
  const [loops, setLoops] = useState<Loop[]>([]);
  const [isLoadingLoops, setIsLoadingLoops] = useState(false);
  const [isUpdatingLoop, setIsUpdatingLoop] = useState(false);
  const [loopsError, setLoopsError] = useState<string | null>(null);

  const activeTab = readTabParam(location.search);
  const page = useMemo(() => {
    const fromUrl = readPageParam(location.search);
    return fromUrl ?? clampPage(savedListPage);
  }, [location.search, savedListPage]);

  const statsLoops = useMemo(
    () => filterLoopsByTab(loops, "active"),
    [loops],
  );
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

  const hasServerMetrics = useMemo(
    () => loops.length > 0 && loops.every((l) => l.metrics != null),
    [loops],
  );

  const backendLoopIdsKey = useMemo(
    () => (hasServerMetrics ? "" : getBackendLoopIdsForMatchLoading(loops).join("|")),
    [hasServerMetrics, loops],
  );

  const statsById = useMemo(
    () => buildLoopStatsById({ loops, applications, matches }),
    [applications, loops, matches],
  );
  const activeTotals = useMemo(
    () =>
      countLoopStats(
        statsById,
        statsLoops.map((loop) => loop.id),
      ),
    [statsById, statsLoops],
  );

  const loadLoops = useCallback(async () => {
    if (!userId) {
      setLoops([]);
      return;
    }

    setIsLoadingLoops(true);
    setLoopsError(null);
    try {
      const response = await listLoopsViaRest({ includeArchived: true, limit: 100 });
      setLoops(response.items);
    } catch (error: unknown) {
      setLoops([]);
      setLoopsError(getErrorMessage(error));
    } finally {
      setIsLoadingLoops(false);
    }
  }, [userId]);

  useEffect(() => {
    void loadLoops();
  }, [loadLoops]);


  useEffect(() => {
    let cancelled = false;
    const loopIds = backendLoopIdsKey ? backendLoopIdsKey.split("|") : [];

    async function loadMatches() {
      if (!userId || loopIds.length === 0) {
        setMatches([]);
        return;
      }

      try {
        const pages = await Promise.all(
          loopIds.map((loopId) =>
            listLoopVacancyMatchesViaRest(loopId, { limit: 100, offset: 0 }),
          ),
        );
        if (!cancelled) setMatches(pages.flatMap((page) => page.items));
      } catch {
        if (!cancelled) setMatches([]);
      }
    }

    loadMatches().catch(() => {
      if (!cancelled) setMatches([]);
    });

    return () => {
      cancelled = true;
    };
  }, [backendLoopIdsKey, userId]);

  useEffect(() => {
    let cancelled = false;

    async function loadApplications() {
      if (!userId || !backendLoopIdsKey) {
        setApplications([]);
        return;
      }

      setIsLoadingApplications(true);
      setStatsError(null);

      try {
        const rows = await loadAllActiveApplications(userId);
        if (!cancelled) setApplications(rows);
      } catch {
        if (!cancelled) setApplications([]);
      } finally {
        if (!cancelled) setIsLoadingApplications(false);
      }
    }

    loadApplications().catch(() => {
      if (!cancelled) setApplications([]);
    });

    return () => {
      cancelled = true;
    };
  }, [backendLoopIdsKey, userId]);

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

  const setLoopStatus = useCallback(
    async (loopId: string, status: "active" | "paused" | "archived") => {
      setIsUpdatingLoop(true);
      try {
        if (status === "archived") {
          await archiveLoopViaRest(loopId);
        } else {
          await updateLoopViaRest(loopId, { status });
        }
        await loadLoops();
      } finally {
        setIsUpdatingLoop(false);
      }
    },
    [loadLoops],
  );

  const showFrom =
    visibleLoops.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const showTo =
    visibleLoops.length === 0 ? 0 : showFrom + pagedLoops.length - 1;
  const isLoading = isLoadingLoops || isLoadingApplications;
  const isFetching = isLoadingLoops || isUpdatingLoop;
  const error = loopsError ?? statsError;

  const content = renderContent({
    activeTab,
    error,
    isFetching,
    isLoading,
    onArchive: (id) => {
      setLoopStatus(id, "archived").catch((error: unknown) => {
        setStatsError(getErrorMessage(error));
      });
    },
    onOpenApplications,
    onOpenLoop,
    onOpenMatches,
    onAddApplication,
    onImportVacancy,
    onPageChange: goToPage,
    onRestore: (id) => {
      setLoopStatus(id, "active").catch((error: unknown) => {
        setStatsError(getErrorMessage(error));
      });
    },
    onTogglePause: (loop) => {
      setLoopStatus(loop.id, isLoopPaused(loop) ? "active" : "paused").catch(
        (error: unknown) => {
          setStatsError(getErrorMessage(error));
        },
      );
    },
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
      <div className="shrink-0 border-b border-border bg-background px-7 py-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="mb-1 flex items-center gap-2 text-[11.5px] text-subtle-foreground">
              <span>Loopboard</span>
              <span>/</span>
              <span className="text-muted-foreground">
                {t("loops.listTitle", "Loops")}
              </span>
            </div>
            <h1 className="text-[22px] font-semibold leading-none tracking-[-0.025em] text-foreground">
              {t("loops.listTitle", "Loops")}
            </h1>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {t("loops.listSubtitle", "Create a loop and track matches.")}
            </p>
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

        <div className="mt-4 flex w-fit items-center gap-1 rounded-lg bg-muted/50 p-1">
          <TabButton
            active={activeTab === "active"}
            onClick={() => setTab("active")}
          >
            Active
          </TabButton>
          <TabButton
            active={activeTab === "paused"}
            onClick={() => setTab("paused")}
          >
            Paused
          </TabButton>
          <TabButton
            active={activeTab === "archive"}
            onClick={() => setTab("archive")}
          >
            Archived
          </TabButton>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="space-y-4 p-7">
          <div className="grid grid-cols-4 gap-3.5">
            <StatTile
              label={t("loops.statLoops", "Loops")}
              value={statsLoops.length}
              sub={`Active: ${statsLoops.filter((l) => getLoopStatus(l) === "active").length}`}
            />
            <StatTile
              label={t("loops.statMatches", "Matches")}
              value={activeTotals.matches}
              sub={t("loops.statMatchesSub", "System matches")}
            />
            <StatTile
              label={t("loops.statApplied", "Applied")}
              value={activeTotals.applied}
              sub="From all loops"
              accent
            />
            <StatTile
              label={t("loops.statToday", "Today")}
              value={activeTotals.today}
              sub={t("loops.statTodaySub", "Fresh today")}
              green={activeTotals.today > 0}
            />
          </div>
          {content}
        </div>
      </div>

      <CreateLoopModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreateLoop={createLoopViaRest}
        onCreated={(id) => {
          void loadLoops();
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

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  const activeClass = active
    ? "bg-background text-foreground shadow-sm"
    : "text-muted-foreground hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        activeClass,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function LoopCardSkeleton() {
  return (
    <div className="animate-pulse rounded-[14px] border border-border bg-card p-5">
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,2fr)_minmax(0,1fr)] items-center gap-6">
        <div className="space-y-2">
          <div className="h-4 w-16 rounded bg-muted" />
          <div className="h-4 w-32 rounded bg-muted" />
          <div className="h-3 w-24 rounded bg-muted/70" />
        </div>
        <div className="flex gap-2">
          <div className="h-6 w-20 rounded-full bg-muted" />
          <div className="h-6 w-14 rounded-full bg-muted" />
        </div>
        <div className="flex flex-col items-end gap-3">
          <div className="flex gap-5">
            <div className="h-6 w-8 rounded bg-muted" />
            <div className="h-6 w-8 rounded bg-muted" />
            <div className="h-6 w-8 rounded bg-muted" />
          </div>
          <div className="flex gap-1.5">
            <div className="h-7 w-16 rounded-[6px] bg-muted" />
            <div className="h-7 w-14 rounded-[6px] bg-muted" />
          </div>
        </div>
      </div>
    </div>
  );
}

function renderContent(params: {
  activeTab: LoopsTab;
  error: string | null;
  isFetching: boolean;
  isLoading: boolean;
  onArchive: (id: string) => void;
  onCreateLoop: () => void;
  onOpenApplications: (id: string) => void;
  onOpenLoop: (id: string) => void;
  onOpenMatches: (id: string) => void;
  onAddApplication: (id: string) => void;
  onImportVacancy: (id: string) => void;
  onPageChange: (nextPage: number) => void;
  onRestore: (id: string) => void;
  onTogglePause: (loop: Loop) => void;
  page: number;
  pagedLoops: Loop[];
  showFrom: number;
  showTo: number;
  statsById: ReturnType<typeof buildLoopStatsById>;
  t: ReturnType<typeof useTranslation>["t"];
  total: number;
  totalPages: number;
}) {
  const {
    activeTab,
    error,
    isFetching,
    isLoading,
    onArchive,
    onCreateLoop,
    onOpenApplications,
    onOpenLoop,
    onOpenMatches,
    onAddApplication,
    onImportVacancy,
    onPageChange,
    onRestore,
    onTogglePause,
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
    if (activeTab === "archive") {
      return <div className="text-sm text-muted-foreground">No archived loops.</div>;
    }
    if (activeTab === "paused") {
      return <div className="text-sm text-muted-foreground">No paused loops.</div>;
    }
    return (
      <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-card py-16 text-center">
        <div className="text-[32px] leading-none">🔍</div>
        <p className="mt-3 text-[15px] font-medium text-foreground">
          {t("loops.emptyTitle", "No loops yet")}
        </p>
        <p className="mt-1 text-[13px] text-muted-foreground">
          {t("loops.emptyHint", "Create your first loop to start tracking job opportunities.")}
        </p>
        <button
          type="button"
          onClick={onCreateLoop}
          className="mt-5 rounded-lg bg-primary px-4 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          {t("loops.newLoop", "New loop")}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {pagedLoops.map((loop) => (
          <LoopCard
            key={loop.id}
            loop={loop}
            stats={getEffectiveStats(statsById, loop)}
            busy={isFetching}
            onArchive={onArchive}
            onOpen={onOpenLoop}
            onOpenApplications={onOpenApplications}
            onOpenMatches={onOpenMatches}
            onAddApplication={onAddApplication}
            onImportVacancy={onImportVacancy}
            onRestore={onRestore}
            onTogglePause={onTogglePause}
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

async function loadAllActiveApplications(userId: string): Promise<AppRow[]> {
  const rows: AppRow[] = [];
  let offset = 0;
  let total = 0;

  do {
    const page = await listApplicationsViaRest(userId, {
      archived: false,
      limit: APPLICATIONS_PAGE_SIZE,
      offset,
      sort: "updated_at_desc",
    });
    rows.push(...page.items);
    total = page.total;
    offset = page.offset + page.limit;

    if (page.items.length === 0) break;
  } while (offset < total);

  return rows;
}
