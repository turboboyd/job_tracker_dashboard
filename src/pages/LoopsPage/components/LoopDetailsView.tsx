import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { joinTitles, type Loop } from "src/entities/loop";
import {
  archiveLoopViaRest,
  getLoopViaRest,
  listLoopSourceStatsViaRest,
  type LoopSourceStat,
  updateLoopViaRest,
} from "src/features/loops";
import {
  listLoopVacancyMatchesViaRest,
  type VacancyMatch,
} from "src/features/vacancyMatches";
import {
  setLastLoopsUrl,
  setLoopDetailsPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage } from "src/shared/lib";
import { updateURLParams } from "src/shared/lib/url/updateURLParams";

import { LoopDetailContent } from "./loopDetailsView.content";
import {
  buildStatTiles,
  computeConversionRate,
  countMatchesByStatus,
  countMatchesToday,
  timeAgoFromIso,
} from "./loopDetailsView.helpers";
import { useTimeAgoLabel } from "./loopDetailsView.hooks";
import { LoopStatusBadge } from "./loopDetailsView.parts";
import type { TabKey } from "./loopDetailsView.types";
import { getLoopStatus, isBackendLoopId } from "./loopsPage.helpers";

export function LoopDetailsView({
  loopId,
  onBack,
  onOpenMatches,
}: {
  loopId: string;
  onBack: () => void;
  onOpenMatches?: (id: string) => void;
}) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const savedDetailsPage = useAppSelector(
    (s) => s.loopsUi.detailsPageByLoopId[loopId],
  );
  const [loop, setLoop] = useState<Loop | null>(null);
  const [isLoadingLoop, setIsLoadingLoop] = useState(false);
  const [loopError, setLoopError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [matchesLoading, setMatchesLoading] = useState(false);
  const [matchesRefreshKey, setMatchesRefreshKey] = useState(0);
  const [sourceStats, setSourceStats] = useState<LoopSourceStat[]>([]);
  const [sourceStatsLoading, setSourceStatsLoading] = useState(false);
  const [sourceStatsRefreshKey, setSourceStatsRefreshKey] = useState(0);
  const formatTimeAgo = useTimeAgoLabel();

  const handleRefreshSourceStats = useCallback(() => {
    setSourceStatsRefreshKey((k) => k + 1);
  }, []);

  // Saving a vacancy from the preview tab must make it visible in Analytics /
  // Overview without a full page reload. Re-fetch the data those tabs derive
  // from: the matches list (funnel + by-source) and the loop (metrics.matches_saved).
  const handleMatchSaved = useCallback(() => {
    setMatchesRefreshKey((k) => k + 1);
    setSourceStatsRefreshKey((k) => k + 1);
    if (!isBackendLoopId(loopId)) return;
    getLoopViaRest(loopId)
      .then((item) => setLoop(item))
      .catch(() => {
        // Best-effort refresh of loop metrics; the next reload will reconcile.
      });
  }, [loopId]);

  const readPageFromSearch = (search: string): number | null => {
    try {
      const sp = new URLSearchParams(search);
      const raw = sp.get("page");
      const n = raw ? Number(raw) : NaN;
      const i = Number.isFinite(n) ? Math.trunc(n) : NaN;
      return i > 0 ? i : null;
    } catch {
      return null;
    }
  };

  const urlPage = readPageFromSearch(location.search);
  const detailsPage = urlPage ?? savedDetailsPage ?? 1;

  useEffect(() => {
    if (urlPage !== null) return;
    updateURLParams(navigate, location, { page: String(detailsPage) }, { replace: true });
  }, [urlPage, detailsPage, navigate, location]);

  useEffect(() => {
    dispatch(setLoopDetailsPage({ loopId, page: detailsPage }));
    dispatch(setLastLoopsUrl(`${location.pathname}${location.search}`));
  }, [dispatch, loopId, detailsPage, location.pathname, location.search]);

  useEffect(() => {
    let cancelled = false;

    async function loadLoop() {
      if (!isBackendLoopId(loopId)) {
        setLoop(null);
        setLoopError(t("loops.notFound", "Loop not found."));
        return;
      }

      setIsLoadingLoop(true);
      setLoopError(null);
      try {
        const item = await getLoopViaRest(loopId);
        if (!cancelled) setLoop(item);
      } catch (error: unknown) {
        if (!cancelled) {
          setLoop(null);
          setLoopError(getErrorMessage(error));
        }
      } finally {
        if (!cancelled) setIsLoadingLoop(false);
      }
    }

    void loadLoop();
    return () => {
      cancelled = true;
    };
  }, [loopId, t]);

  useEffect(() => {
    if (!isBackendLoopId(loopId)) return;
    let cancelled = false;
    setMatchesLoading(true);
    listLoopVacancyMatchesViaRest(loopId, { limit: 200 })
      .then((envelope) => {
        if (!cancelled) setMatches(envelope.items);
      })
      .catch(() => {
        if (!cancelled) setMatches([]);
      })
      .finally(() => {
        if (!cancelled) setMatchesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loopId, matchesRefreshKey]);

  useEffect(() => {
    if (!isBackendLoopId(loopId)) return;
    let cancelled = false;
    setSourceStatsLoading(true);
    listLoopSourceStatsViaRest(loopId)
      .then((res) => {
        if (!cancelled) setSourceStats(res.items);
      })
      .catch(() => {
        if (!cancelled) setSourceStats([]);
      })
      .finally(() => {
        if (!cancelled) setSourceStatsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loopId, sourceStatsRefreshKey]);

  const handlePauseResume = useCallback(async () => {
    if (!loop) return;
    const nextStatus = getLoopStatus(loop) === "paused" ? "active" : "paused";
    setIsActionBusy(true);
    setActionError(null);
    try {
      const updated = await updateLoopViaRest(loop.id, { status: nextStatus });
      setLoop(updated);
    } catch (error: unknown) {
      setActionError(getErrorMessage(error));
    } finally {
      setIsActionBusy(false);
    }
  }, [loop]);

  const handleArchive = useCallback(async () => {
    if (!loop) return;
    setIsActionBusy(true);
    setActionError(null);
    try {
      await archiveLoopViaRest(loop.id);
      onBack();
    } catch (error: unknown) {
      setActionError(getErrorMessage(error));
      setIsActionBusy(false);
    }
  }, [loop, onBack]);

  const title = useMemo(
    () => loop?.name ?? t("loops.detailsTitle", "Loop"),
    [loop?.name, t],
  );

  const subtitle = useMemo(() => {
    if (!loop) return null;
    const roles = joinTitles(loop.titles) || t("loops.dash", "—");
    const remoteText =
      loop.remoteMode === "remote_only"
        ? t("loops.remoteOnly", "Remote")
        : t("loops.any", "Any");
    return `${roles} · ${loop.location || t("loops.dash", "—")} · ${remoteText}`;
  }, [loop, t]);

  const status = loop ? getLoopStatus(loop) : "active";
  const isArchived = status === "archived";

  const matchesToday = useMemo(() => countMatchesToday(matches), [matches]);
  const statusCounts = useMemo(() => countMatchesByStatus(matches), [matches]);
  const savedTotal = loop?.metrics?.matches_saved ?? statusCounts.saved + statusCounts.converted;
  const appliedTotal = loop?.metrics?.applied_count ?? loop?.metrics?.applications_total ?? statusCounts.converted;
  const conversionRate = computeConversionRate(savedTotal, appliedTotal);
  const lastSyncAgo = formatTimeAgo(timeAgoFromIso(loop?.lastDiscoveryAt));

  const nextRunLabel = useMemo(() => {
    if (!loop?.autoDiscoveryEnabled || !loop.nextRunAt) return null;
    const diffMs = Date.parse(loop.nextRunAt) - Date.now();
    if (diffMs <= 0) return t("loops.nextSyncOverdue", "Sync pending");
    const mins = Math.ceil(diffMs / 60_000);
    if (mins < 60) return t("loops.nextSyncIn", "Next sync in {{value}}", { value: t("loops.minutesShort", "{{n}} min", { n: mins }) });
    const hrs = Math.round(mins / 60);
    return t("loops.nextSyncIn", "Next sync in {{value}}", { value: t("loops.hoursShort", "{{n}} h", { n: hrs }) });
  }, [loop?.autoDiscoveryEnabled, loop?.nextRunAt, t]);

  const tabs: { key: TabKey; label: string; badge?: number }[] = [
    { key: "overview",  label: t("loops.tabOverview",  "Overview")  },
    { key: "sources",   label: t("loops.tabSources",   "Sources"), badge: loop?.selectedSources?.length || undefined },
    { key: "preview",   label: t("loops.tabPreview",   "Поиск")     },
    { key: "history",   label: t("loops.tabHistory",   "History")   },
    { key: "analytics", label: t("loops.tabAnalytics", "Analytics") },
    { key: "settings",  label: t("loops.tabSettings",  "Settings")  },
  ];

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <style>{`
        @keyframes loop-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <div className="shrink-0 border-b border-border bg-background">
        <div className="flex items-start justify-between gap-4 px-7 pt-5">
          <div className="flex min-w-0 items-start gap-3.5">
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[17px] font-semibold text-white"
              style={{ background: "linear-gradient(135deg, rgb(var(--primary)), rgb(var(--secondary)))" }}
              aria-hidden="true"
            >
              ↻
            </div>
            <div className="min-w-0">
              <div className="mb-1 flex items-center gap-2 text-[11.5px] text-muted-foreground">
                <button
                  type="button"
                  className="transition-colors hover:text-foreground"
                  onClick={onBack}
                >
                  ← {t("loops.listTitle", "Loops")}
                </button>
                <span>/</span>
                <span className="truncate text-muted-foreground">{title}</span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-[22px] font-semibold leading-none tracking-[-0.025em] text-foreground">
                  {title}
                </h1>
                {loop ? <LoopStatusBadge status={status} /> : null}
                {loop?.lastDiscoveryAt ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                    <span
                      className="h-1.5 w-1.5 rounded-full bg-emerald-500"
                      style={{ animation: "loop-pulse 2s infinite" }}
                    />
                    {t("loops.lastSyncShort", "Sync · {{value}}", { value: lastSyncAgo })}
                  </span>
                ) : null}
                {nextRunLabel ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2 py-0.5 text-[11px] text-muted-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-sky-400" />
                    {nextRunLabel}
                  </span>
                ) : null}
              </div>
              {subtitle ? (
                <p className="mt-1 truncate text-[13px] text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {loop && !isArchived ? (
              <button
                type="button"
                disabled={isActionBusy}
                className="rounded-md px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => { void handlePauseResume(); }}
              >
                {status === "paused" ? t("loops.resume", "Resume") : t("loops.pause", "Pause")}
              </button>
            ) : null}
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => setActiveTab("settings")}
            >
              {t("loops.editSettings", "Settings")}
            </button>
            {onOpenMatches && loop ? (
              <button
                type="button"
                className="rounded-md bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
                onClick={() => onOpenMatches(loop.id)}
              >
                {t("loops.openMatches", "Open Matches")} →
              </button>
            ) : null}
          </div>
        </div>

        {/* Stats row */}
        {loop ? (
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] divide-x divide-border border-t border-border px-7">
            {buildStatTiles(t, {
              savedTotal,
              appliedTotal,
              matchesToday,
              conversionRate,
            }).map((stat, i) => (
              <div key={stat.label} className={`flex flex-col py-3 ${i === 0 ? "pr-5" : "px-5"}`}>
                <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
                  {stat.label}
                </span>
                <span
                  className={`mt-0.5 text-[22px] font-semibold leading-none tabular-nums ${
                    stat.accent ? "text-primary" : "text-foreground"
                  }`}
                >
                  {stat.value}
                </span>
                {stat.sub ? (
                  <span className="mt-1 text-[11px] text-muted-foreground/70">{stat.sub}</span>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {/* Tab bar */}
        <div className="flex items-end gap-0 overflow-x-auto px-7">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-2.5 text-[13px] transition-colors",
                activeTab === tab.key
                  ? "border-primary font-medium text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
              {tab.badge ? (
                <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-semibold tabular-nums text-muted-foreground">
                  {tab.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-background">
        <div className="p-7">
          {actionError ? (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
              {actionError}
            </div>
          ) : null}
          <LoopDetailContent
            isLoadingLoop={isLoadingLoop}
            loopError={loopError}
            loop={loop}
            activeTab={activeTab}
            matches={matches}
            matchesLoading={matchesLoading}
            sourceStats={sourceStats}
            sourceStatsLoading={sourceStatsLoading}
            onRefreshSourceStats={handleRefreshSourceStats}
            onMatchSaved={handleMatchSaved}
            isArchived={isArchived}
            status={status}
            onOpenMatches={onOpenMatches}
            onPauseResume={handlePauseResume}
            onArchive={handleArchive}
            onLoopUpdated={setLoop}
          />
        </div>
      </div>
    </div>
  );
}
