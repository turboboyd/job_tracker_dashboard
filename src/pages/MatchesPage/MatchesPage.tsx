import { Plus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import type { Loop } from "src/entities/loop";
import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import {
  createApplicationFromVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  patchLoopVacancyMatchViaRest,
  type VacancyMatch,
  type VacancyMatchStatus,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import {
  getApplicationDetailsRoute,
  MATCHES_SAVED_MATCHES_COPY,
  type MatchApplicationFeedback,
} from "./components/matchesSavedVacancyMatches.helpers";
import { useMatchesPageController } from "./model/useMatchesPageController";

// ─── Types ───────────────────────────────────────────────────────────────────

type StatusTab = "all" | VacancyMatchStatus;

interface VacancyMatchWithLoop {
  match: VacancyMatch;
  loopName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const STATUS_TABS: Array<{ key: StatusTab; label: string }> = [
  { key: "all",       label: "All"       },
  { key: "new",       label: "New"       },
  { key: "saved",     label: "Saved"     },
  { key: "converted", label: "Applied"   },
  { key: "ignored",   label: "Hidden"    },
];

const SOURCE_LABEL_MAP: Record<string, string> = {
  arbeitsagentur: "Arbeitsagentur",
  linkedin: "LinkedIn",
  stepstone: "StepStone",
  indeed: "Indeed",
  xing: "XING",
  glassdoor: "Glassdoor",
  angellist: "AngelList",
  other: "Other",
};

function normalizeSource(source: string | null): string {
  return source?.trim().toLowerCase() ?? "other";
}

function formatSourceLabel(source: string): string {
  return SOURCE_LABEL_MAP[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

function getStatusBadgeClass(status: VacancyMatchStatus): string {
  if (status === "new")       return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
  if (status === "converted") return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400";
  if (status === "ignored")   return "bg-muted text-muted-foreground/60";
  return "bg-muted text-muted-foreground";
}

function getStatusLabel(status: VacancyMatchStatus): string {
  if (status === "new")       return "New";
  if (status === "saved")     return "Saved";
  if (status === "converted") return "Applied";
  return "Hidden";
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

function isActionable(match: VacancyMatch): boolean {
  return match.status === "new" || match.status === "saved";
}

async function loadMatchesFromLoops(
  loops: Loop[],
): Promise<VacancyMatchWithLoop[]> {
  const envelopes = await Promise.all(
    loops.map(async (loop) => {
      const envelope = await listLoopVacancyMatchesViaRest(loop.id, { limit: 100, offset: 0 });
      return envelope.items.map((match) => ({
        match,
        loopName: loop.name || loop.id,
      }));
    }),
  );
  return envelopes.flat().sort((a, b) => b.match.updatedAt.localeCompare(a.match.updatedAt));
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
        <button
          key={key}
          type="button"
          onClick={() => onSetSource(key)}
          className={pillClass(activeSource === key)}
        >
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
  counts: Record<StatusTab, number>;
  activeStatus: StatusTab;
  onSetStatus: (s: StatusTab) => void;
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

// ─── VacancyMatchRow ─────────────────────────────────────────────────────────

function VacancyMatchRow({
  item,
  isActive,
  onClick,
}: {
  item: VacancyMatchWithLoop;
  isActive: boolean;
  onClick: () => void;
}) {
  const { match, loopName } = item;
  const avatarLetter = (match.companyName || match.roleTitle || "?").charAt(0).toUpperCase();
  const score = getConfidenceScore(match.confidence);
  const srcLabel = match.source ? formatSourceLabel(normalizeSource(match.source)) : null;

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
            {match.roleTitle || "—"}
          </span>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${getStatusBadgeClass(match.status)}`}>
            {getStatusLabel(match.status)}
          </span>
        </div>
        <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
          {[match.companyName, match.locationText, srcLabel]
            .filter(Boolean).join(" · ")}
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

// ─── VacancyMatchDetailPane ───────────────────────────────────────────────────

function VacancyMatchDetailActions({
  match,
  convertingId,
  ignoringId,
  onConvert,
  onIgnore,
}: {
  match: VacancyMatch;
  convertingId: string | null;
  ignoringId: string | null;
  onConvert: (m: VacancyMatch) => void;
  onIgnore: (m: VacancyMatch) => void;
}) {
  const actionable = isActionable(match);
  if (!actionable) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        disabled={convertingId === match.id}
        onClick={() => onConvert(match)}
        className="rounded-[7px] bg-primary px-3.5 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
      >
        {convertingId === match.id ? "Creating…" : MATCHES_SAVED_MATCHES_COPY.createApplication}
      </button>
      <a
        href={match.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="rounded-[7px] border border-border px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted"
      >
        Open ↗
      </a>
      <button
        type="button"
        disabled={ignoringId === match.id}
        onClick={() => onIgnore(match)}
        className="rounded-[7px] border border-border px-3.5 py-1.5 text-[12.5px] text-muted-foreground transition-colors hover:bg-muted disabled:opacity-50"
      >
        {ignoringId === match.id ? "…" : MATCHES_SAVED_MATCHES_COPY.ignore}
      </button>
    </div>
  );
}

function VacancyMatchDetailPane({
  item,
  convertingId,
  ignoringId,
  feedbackById,
  onConvert,
  onIgnore,
  onNavigate,
}: {
  item: VacancyMatchWithLoop | null;
  convertingId: string | null;
  ignoringId: string | null;
  feedbackById: Record<string, MatchApplicationFeedback>;
  onConvert: (m: VacancyMatch) => void;
  onIgnore: (m: VacancyMatch) => void;
  onNavigate: (appId: string) => void;
}) {
  if (!item) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-border bg-card text-[12.5px] text-muted-foreground">
        Select a vacancy to see details
      </div>
    );
  }

  const { match, loopName } = item;
  const avatarLetter = (match.companyName || match.roleTitle || "?").charAt(0).toUpperCase();
  const score = getConfidenceScore(match.confidence);
  const srcLabel = match.source ? formatSourceLabel(normalizeSource(match.source)) : null;
  const feedback = feedbackById[match.id] ?? (match.applicationId ? {
    applicationId: match.applicationId,
    message: MATCHES_SAVED_MATCHES_COPY.applicationAlreadyCreated,
  } : null);

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-5 py-4">
        <div className="flex gap-3 items-start mb-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[9px] border border-border bg-muted text-[15px] font-semibold text-foreground select-none">
            {avatarLetter}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${getStatusBadgeClass(match.status)}`}>
                {getStatusLabel(match.status)}
              </span>
              {srcLabel ? (
                <span className="inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-[10.5px] text-muted-foreground">
                  {srcLabel}
                </span>
              ) : null}
              {score !== null ? (
                <span className={`inline-flex h-6 w-6 items-center justify-center rounded border text-[11px] font-semibold tabular-nums ${getScoreBadgeClass(score)}`}>
                  {score}
                </span>
              ) : null}
            </div>
            <div className="text-[16px] font-semibold leading-snug text-foreground tracking-tight">
              {match.roleTitle || "—"}
            </div>
            <div className="text-[12.5px] text-muted-foreground mt-0.5">
              {[match.companyName, match.locationText].filter(Boolean).join(" · ")}
              {loopName ? <span className="ml-1.5 text-muted-foreground/60">· {loopName}</span> : null}
            </div>
          </div>
        </div>

        <VacancyMatchDetailActions
          match={match}
          convertingId={convertingId}
          ignoringId={ignoringId}
          onConvert={onConvert}
          onIgnore={onIgnore}
        />
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Source URL */}
        <a
          href={match.sourceUrl}
          target="_blank"
          rel="noreferrer"
          className="block truncate text-[12px] text-primary hover:underline"
        >
          {match.sourceUrl}
        </a>

        {/* AI analysis */}
        <VacancyAnalysisPanel loopId={match.loopId} matchId={match.id} />

        {/* Description */}
        {match.vacancyDescription ? (
          <div>
            <div className="mb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
              Description
            </div>
            <div className="text-[12.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap line-clamp-[20]">
              {match.vacancyDescription}
            </div>
          </div>
        ) : null}

        {/* Application feedback */}
        {feedback ? (
          <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
            <span>{feedback.message}</span>
            <button
              type="button"
              className="rounded-md border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
              onClick={() => onNavigate(feedback.applicationId)}
            >
              {MATCHES_SAVED_MATCHES_COPY.openApplication}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ─── MatchesBody ─────────────────────────────────────────────────────────────

function MatchesBody({
  isLoading,
  allMatches,
  filtered,
  selectedItem,
  convertingId,
  ignoringId,
  feedbackById,
  onSelectId,
  onConvert,
  onIgnore,
  onNavigate,
}: {
  isLoading: boolean;
  allMatches: VacancyMatchWithLoop[];
  filtered: VacancyMatchWithLoop[];
  selectedItem: VacancyMatchWithLoop | null;
  convertingId: string | null;
  ignoringId: string | null;
  feedbackById: Record<string, MatchApplicationFeedback>;
  onSelectId: (id: string) => void;
  onConvert: (m: VacancyMatch) => void;
  onIgnore: (m: VacancyMatch) => void;
  onNavigate: (appId: string) => void;
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

  if (allMatches.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="text-[14px] font-medium text-foreground">No vacancies yet</p>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            Vacancies will appear here when your loops find matches.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid h-full grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-4">
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="shrink-0 flex items-center border-b border-border px-4 py-2.5">
          <span className="text-[12px] text-muted-foreground">
            <strong className="font-semibold text-foreground tabular-nums">{filtered.length}</strong> vacancies
          </span>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-[13px] font-medium text-foreground">Nothing here</p>
              <p className="mt-1 text-[12px] text-muted-foreground">Try a different filter or source.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <VacancyMatchRow
                key={item.match.id}
                item={item}
                isActive={selectedItem?.match.id === item.match.id}
                onClick={() => onSelectId(item.match.id)}
              />
            ))
          )}
        </div>
      </div>

      <VacancyMatchDetailPane
        item={selectedItem}
        convertingId={convertingId}
        ignoringId={ignoringId}
        feedbackById={feedbackById}
        onConvert={onConvert}
        onIgnore={onIgnore}
        onNavigate={onNavigate}
      />
    </div>
  );
}

// ─── MatchesPage ─────────────────────────────────────────────────────────────

export default function MatchesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const vm = useMatchesPageController();
  const { loopsQ } = vm.queries;

  const [allMatches, setAllMatches] = useState<VacancyMatchWithLoop[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [activeSource, setActiveSource] = useState("all");
  const [activeStatus, setActiveStatus] = useState<StatusTab>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [ignoringId, setIgnoringId] = useState<string | null>(null);
  const [feedbackById, setFeedbackById] = useState<Record<string, MatchApplicationFeedback>>({});

  // Load VacancyMatches from all active loops
  useEffect(() => {
    if (loopsQ.isLoading) return;
    if (vm.loops.length === 0) { setAllMatches([]); return; }

    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const activeLoops = vm.loops.filter((l) => l.status !== "archived");
    loadMatchesFromLoops(activeLoops)
      .then((items) => { if (!cancelled) setAllMatches(items); })
      .catch((err: unknown) => { if (!cancelled) setError(getErrorMessage(err)); })
      .finally(() => { if (!cancelled) setIsLoading(false); });

    return () => { cancelled = true; };
  }, [vm.loops, loopsQ.isLoading, reloadKey]);

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { match } of allMatches) {
      const src = normalizeSource(match.source);
      counts.set(src, (counts.get(src) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => ({
      key, label: formatSourceLabel(key), count,
    }));
  }, [allMatches]);

  const statusCounts = useMemo(() => {
    const base = allMatches.filter(
      ({ match }) => activeSource === "all" || normalizeSource(match.source) === activeSource,
    );
    const counts: Record<StatusTab, number> = { all: base.length, new: 0, saved: 0, converted: 0, ignored: 0 };
    for (const { match } of base) counts[match.status] = (counts[match.status] ?? 0) + 1;
    return counts;
  }, [allMatches, activeSource]);

  const filtered = useMemo(
    () => allMatches.filter(({ match }) => {
      if (activeSource !== "all" && normalizeSource(match.source) !== activeSource) return false;
      if (activeStatus !== "all" && match.status !== activeStatus) return false;
      return true;
    }),
    [allMatches, activeSource, activeStatus],
  );

  const selectedItem = useMemo(
    () => filtered.find(({ match }) => match.id === selectedId) ?? filtered[0] ?? null,
    [filtered, selectedId],
  );

  async function handleConvert(match: VacancyMatch) {
    setConvertingId(match.id);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(match.loopId, match.id);
      setAllMatches((cur) => cur.map((item) =>
        item.match.id === match.id ? { ...item, match: result.match } : item,
      ));
      setFeedbackById((cur) => ({
        ...cur,
        [match.id]: {
          applicationId: result.applicationId,
          message: result.alreadyLinked
            ? MATCHES_SAVED_MATCHES_COPY.applicationAlreadyCreated
            : MATCHES_SAVED_MATCHES_COPY.applicationCreated,
        },
      }));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setConvertingId(null);
    }
  }

  async function handleIgnore(match: VacancyMatch) {
    setIgnoringId(match.id);
    try {
      const updated = await patchLoopVacancyMatchViaRest(match.loopId, match.id, { status: "ignored" });
      setAllMatches((cur) => cur.map((item) =>
        item.match.id === match.id ? { ...item, match: updated } : item,
      ));
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setIgnoringId(null);
    }
  }

  const title = t("matches.list.title", "Matches");

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
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
            {!isLoading && allMatches.length > 0 ? (
              <p className="mt-1 text-[13px] text-muted-foreground">
                {allMatches.length} vacancies · {sources.length} source{sources.length === 1 ? "" : "s"}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("matches.list.addManual", "Add vacancy")}
          </button>
        </div>
      </div>

      {/* Sources strip */}
      <SourcesStrip
        sources={sources}
        totalCount={allMatches.length}
        activeSource={activeSource}
        onSetSource={setActiveSource}
      />

      {/* Status tabs */}
      <StatusTabBar
        counts={statusCounts}
        activeStatus={activeStatus}
        onSetStatus={setActiveStatus}
      />

      {/* Error */}
      {error ? (
        <div className="shrink-0 mx-7 mt-3 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
          {error}
        </div>
      ) : null}

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-hidden bg-background p-6">
        <MatchesBody
          isLoading={isLoading}
          allMatches={allMatches}
          filtered={filtered}
          selectedItem={selectedItem}
          convertingId={convertingId}
          ignoringId={ignoringId}
          feedbackById={feedbackById}
          onSelectId={setSelectedId}
          onConvert={(match) => { void handleConvert(match); }}
          onIgnore={(match) => { void handleIgnore(match); }}
          onNavigate={(appId) => navigate(getApplicationDetailsRoute(appId))}
        />
      </div>
    </div>
  );
}
