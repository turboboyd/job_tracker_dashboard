import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { joinTitles } from "src/entities/loop/lib";
import type { Loop, LoopStatus } from "src/entities/loop/model";
import {
  archiveLoopViaRest,
  getLoopViaRest,
  updateLoopViaRest,
} from "src/features/loops";
import {
  setLastLoopsUrl,
  setLoopDetailsPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage } from "src/shared/lib";
import { updateURLParams } from "src/shared/lib/url/updateURLParams";

import { ArbeitsagenturDiscoveryPreviewPanel } from "./ArbeitsagenturDiscoveryPreviewPanel";
import { CardText } from "./Header";
import { LoopSettingsPanel } from "./LoopSettingsPanel";
import { getLoopStatus, isBackendLoopId } from "./loopsPage.helpers";

function FilterChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
  if (!value) return null;
  return (
    <div className="rounded-[8px] border border-border bg-muted/50 px-3.5 py-2.5">
      <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
        {label}
      </div>
      <div className="mt-1 text-[13.5px] font-medium text-foreground">{value}</div>
      {hint ? <div className="mt-0.5 text-[11px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}

type ChipDef = { label: string; value: string };

function buildLoopChips(loop: Loop, labels: Record<string, string>): ChipDef[] {
  const isRemote = loop.filters?.workMode === "remote_only" || loop.remoteMode === "remote_only";
  const radiusKm = loop.filters?.radiusKm ?? loop.radiusKm;

  const raw: ChipDef[] = [
    { label: labels.role, value: loop.filters?.role || joinTitles(loop.titles) },
    { label: labels.location, value: loop.filters?.location || loop.location },
    { label: labels.radius, value: radiusKm > 0 ? `${radiusKm} km` : "" },
    { label: labels.mode, value: isRemote ? labels.remote : labels.any },
    { label: labels.employment, value: loop.filters?.employmentType ?? "" },
    { label: labels.keywords, value: loop.filters?.includeKeywords || loop.keywords?.join(", ") || "" },
    { label: labels.exclude, value: loop.filters?.excludeKeywords || loop.excludedKeywords?.join(", ") || "" },
    { label: labels.sources, value: loop.selectedSources?.length ? loop.selectedSources.join(", ") : loop.platforms?.join(", ") ?? "" },
  ];

  return raw.filter((chip) => chip.value && chip.value !== "—");
}

function LoopOverviewTab({ loop }: { loop: Loop }) {
  const { t } = useTranslation();

  const chips = buildLoopChips(loop, {
    role: t("loops.chipRole", "Role"),
    location: t("loops.chipLocation", "Location"),
    radius: t("loops.chipRadius", "Radius"),
    mode: t("loops.chipMode", "Work mode"),
    remote: t("loops.remoteOnly", "Remote only"),
    any: t("loops.any", "Any"),
    employment: t("loops.chipEmployment", "Employment"),
    keywords: t("loops.chipKeywords", "Keywords"),
    exclude: t("loops.chipExclude", "Exclude"),
    sources: t("loops.chipSources", "Sources"),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] border border-border bg-card p-5">
        <h2 className="text-[13px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
          {t("loops.searchParams", "Search parameters")}
        </h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
          {chips.map((chip) => (
            <FilterChip key={chip.label} label={chip.label} value={chip.value} />
          ))}
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeClass(status: LoopStatus): string {
  if (status === "archived") return "bg-muted text-muted-foreground";
  if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

const STATUS_LABEL: Record<LoopStatus, string> = {
  active: "Active",
  paused: "Paused",
  archived: "Archived",
};

function LoopStatusBadge({ status }: { status: LoopStatus }) {
  const label = STATUS_LABEL[status];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${getStatusBadgeClass(status)}`}>
      {label}
    </span>
  );
}

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
  const [activeTab, setActiveTab] = useState<"overview" | "matches" | "settings">("overview");
  const [isActionBusy, setIsActionBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

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

  // если page отсутствует в URL — проставим (replace), чтобы ссылка была шарится
  useEffect(() => {
    if (urlPage !== null) return;

    updateURLParams(
      navigate,
      location,
      { page: String(detailsPage) },
      { replace: true },
    );
  }, [urlPage, detailsPage, navigate, location]);

  // держим Redux в синхроне с фактической страницей
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
    if (!loop) {
      return t(
        "loops.detailsHint",
        "Change filters → Apply → links update and filters persist.",
      );
    }

    const roles = joinTitles(loop.titles) || t("loops.dash", "—");
    const remoteText =
      loop.remoteMode === "remote_only"
        ? t("loops.remoteOnly", "Remote")
        : t("loops.any", "Any");

    return `${roles} · ${loop.location} · ${remoteText}`;
  }, [loop, t]);


  const content = useMemo(() => {
    if (isLoadingLoop) {
      return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
    }

    if (loopError) {
      return <CardText>{loopError}</CardText>;
    }

    if (!loop) {
      return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;
    }

    if (activeTab === "settings") {
      const isArchived = getLoopStatus(loop) === "archived";
      return (
        <LoopSettingsPanel
          loop={loop}
          onSave={async (patch) => {
            const updated = await updateLoopViaRest(loop.id, patch);
            setLoop(updated);
            return updated;
          }}
          isPaused={getLoopStatus(loop) === "paused"}
          onPauseResume={isArchived ? undefined : handlePauseResume}
          onArchive={isArchived ? undefined : handleArchive}
        />
      );
    }

    if (activeTab === "matches") {
      return (
        <div className="space-y-5">
          {/* Primary CTA — full matches page */}
          <div className="flex items-center justify-between rounded-[12px] border border-border bg-card px-5 py-4">
            <div>
              <div className="text-[13.5px] font-medium text-foreground">
                {t("loops.matchesCta", "View all matches for this loop")}
              </div>
              <div className="mt-0.5 text-[12px] text-muted-foreground">
                {t("loops.matchesCtaHint", "Filter, sort, and manage all discovery matches in one place.")}
              </div>
            </div>
            <Link
              to={`/dashboard/matches?loopId=${encodeURIComponent(loop.id)}`}
              className="shrink-0 rounded-md bg-primary px-4 py-2 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
            >
              {t("loops.openMatches", "Open Matches")}
            </Link>
          </div>
          {/* Discovery preview — manual search only */}
          {isBackendLoopId(loop.id) ? (
            <ArbeitsagenturDiscoveryPreviewPanel
              loopId={loop.id}
              selectedSources={loop.selectedSources}
              onMatchSaved={() => { /* discovery-only, no list to refresh */ }}
            />
          ) : null}
        </div>
      );
    }

    return <LoopOverviewTab loop={loop} />;
  }, [
    activeTab,
    isLoadingLoop,
    loopError,
    loop,
    t,
    handlePauseResume,
    handleArchive,
  ]);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border bg-background">
        <div className="flex items-center justify-between gap-4 px-7 pt-5 pb-0">
          <div className="flex min-w-0 items-start gap-3.5">
            {/* Loop icon */}
            <div
              className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[17px] text-white"
              style={{ background: "linear-gradient(135deg, rgb(var(--primary)), rgb(var(--secondary)))" }}
              aria-hidden="true"
            >
              ↻
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
                <span>Loopboard</span>
                <span>/</span>
                <button
                  type="button"
                  className="hover:text-foreground transition-colors"
                  onClick={onBack}
                >
                  {t("loops.listTitle", "Loops")}
                </button>
                <span>/</span>
                <span className="text-muted-foreground truncate">{title}</span>
              </div>
              <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none truncate">
                {title}
              </h1>
              {subtitle ? (
                <p className="mt-1 text-[13px] text-muted-foreground truncate">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {loop ? (
              <>
                <LoopStatusBadge status={getLoopStatus(loop)} />
                {onOpenMatches ? (
                  <button
                    type="button"
                    className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={() => onOpenMatches(loop.id)}
                  >
                    {t("loops.statMatches", "Matches")}
                  </button>
                ) : null}
                {getLoopStatus(loop) !== "archived" ? (
                  <>
                    <button
                      type="button"
                      disabled={isActionBusy}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted disabled:opacity-50"
                      onClick={() => { void handlePauseResume(); }}
                    >
                      {getLoopStatus(loop) === "paused"
                        ? t("loops.resume", "Resume")
                        : t("loops.pause", "Pause")}
                    </button>
                    <button
                      type="button"
                      disabled={isActionBusy}
                      className="flex items-center gap-1.5 rounded-md border border-transparent px-3 py-1.5 text-[12.5px] font-medium text-muted-foreground transition-colors hover:text-destructive hover:bg-destructive/10 disabled:opacity-50"
                      onClick={() => { void handleArchive(); }}
                    >
                      {t("loops.archive", "Archive")}
                    </button>
                  </>
                ) : null}
              </>
            ) : null}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
              onClick={onBack}
            >
              ← {t("loops.back", "Back")}
            </button>
          </div>
        </div>

        {/* Stats row */}
        {loop?.metrics ? (
          <div className="mt-4 flex items-center gap-0 divide-x divide-border border-t border-border px-7">
            <div className="flex flex-col py-3 pr-6">
              <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
                {t("loops.statMatches", "Matches")}
              </span>
              <span className="mt-0.5 text-[20px] font-semibold leading-none tabular-nums text-foreground">
                {loop.metrics.matches_saved}
              </span>
            </div>
            <div className="flex flex-col py-3 px-6">
              <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
                {t("loops.statApplied", "Applied")}
              </span>
              <span className="mt-0.5 text-[20px] font-semibold leading-none tabular-nums text-primary">
                {loop.metrics.applications_total}
              </span>
            </div>
          </div>
        ) : null}

        {/* Tab bar */}
        <div className={`flex items-end gap-0 px-7 ${loop?.metrics ? "" : "mt-4"}`}>
          {(
            [
              { key: "overview", label: t("loops.tabOverview", "Overview") },
              { key: "matches",  label: t("loops.tabMatches",  "Matches")  },
              { key: "settings", label: t("loops.tabSettings", "Settings") },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={[
                "inline-flex items-center px-4 py-2.5 text-[13px] border-b-2 transition-colors whitespace-nowrap",
                activeTab === tab.key
                  ? "border-primary text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {tab.label}
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
          {content}
        </div>
      </div>
    </div>
  );
}
