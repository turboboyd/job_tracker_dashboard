import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { VacancyAnalysisPanel } from "src/features/vacancyAnalysis";
import {
  createApplicationFromVacancyMatchViaRest,
  listLoopVacancyMatchesViaRest,
  type VacancyMatch,
  type VacancyMatchStatus,
} from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";
import { Button } from "src/shared/ui";

import {
  EMPTY_MATCHES_COPY,
  getApplicationDetailsRoute,
  getCreateApplicationButtonLabel,
  isActionableVacancyMatch,
  VACANCY_MATCH_CONVERSION_COPY,
  type VacancyMatchConversionFeedback,
} from "./vacancyMatchesSection.helpers";

type Props = {
  loopId: string;
  reloadKey?: number;
  onAddVacancy?: () => void;
  onOpenSources?: () => void;
};

type StatusTab = "all" | VacancyMatchStatus;

const STATUS_TABS: Array<{ key: StatusTab; label: string }> = [
  { key: "all",       label: "All"       },
  { key: "new",       label: "New"       },
  { key: "saved",     label: "Saved"     },
  { key: "converted", label: "Converted" },
];

function getStatusLabel(match: VacancyMatch): string {
  if (match.status === "converted" && match.applicationId) return "Application created";
  if (match.status === "saved")     return "Saved";
  return "New";
}

function normalizeSource(source: string | null): string {
  return source?.trim().toLowerCase() ?? "other";
}

function formatSourceLabel(source: string): string {
  const MAP: Record<string, string> = {
    arbeitsagentur: "Arbeitsagentur",
    linkedin: "LinkedIn",
    stepstone: "StepStone",
    indeed: "Indeed",
    xing: "XING",
    glassdoor: "Glassdoor",
    angellist: "AngelList",
    other: "Other",
  };
  return MAP[source] ?? source.charAt(0).toUpperCase() + source.slice(1);
}

function StatusBadge({ status }: { status: VacancyMatchStatus }) {
  const styles: Record<VacancyMatchStatus, string> = {
    new:       "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    saved:     "bg-muted text-muted-foreground",
    converted: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-medium ${styles[status]}`}>
      {getStatusLabel({ status } as VacancyMatch)}
    </span>
  );
}

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
  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        onClick={() => onSetSource("all")}
        className={[
          "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
          activeSource === "all"
            ? "border-primary bg-primary/10 text-primary font-medium"
            : "border-border bg-muted text-muted-foreground hover:bg-muted/80",
        ].join(" ")}
      >
        All <span className="tabular-nums">{totalCount}</span>
      </button>
      {sources.map(({ key, label, count }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSetSource(key)}
          className={[
            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11.5px] transition-colors",
            activeSource === key
              ? "border-primary bg-primary/10 text-primary font-medium"
              : "border-border bg-muted text-muted-foreground hover:bg-muted/80",
          ].join(" ")}
        >
          {label} <span className="tabular-nums">{count}</span>
        </button>
      ))}
    </div>
  );
}

function StatusTabBar({
  tabs,
  counts,
  activeStatus,
  onSetStatus,
  onAddVacancy,
}: {
  tabs: Array<{ key: StatusTab; label: string }>;
  counts: Record<StatusTab, number>;
  activeStatus: StatusTab;
  onSetStatus: (s: StatusTab) => void;
  onAddVacancy?: () => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-border">
      <div className="flex items-end gap-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSetStatus(tab.key)}
            className={[
              "inline-flex items-center gap-1.5 px-3.5 py-2 text-[12.5px] border-b-2 transition-colors whitespace-nowrap",
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
      {onAddVacancy ? (
        <Button size="sm" variant="ghost" onClick={onAddVacancy} className="mr-1 text-[12px]">
          + Add vacancy
        </Button>
      ) : null}
    </div>
  );
}

function MatchRow({
  loopId,
  match,
  isExpanded,
  convertingId,
  applicationFeedback,
  onToggle,
  onConvert,
  onNavigate,
}: {
  loopId: string;
  match: VacancyMatch;
  isExpanded: boolean;
  convertingId: string | null;
  applicationFeedback: VacancyMatchConversionFeedback | null;
  onToggle: () => void;
  onConvert: (m: VacancyMatch) => void;
  onNavigate: (appId: string) => void;
}) {
  const actionable = isActionableVacancyMatch(match);
  const avatarLetter = (match.roleTitle || match.companyName || "?").charAt(0).toUpperCase();

  return (
    <div className={`border-b border-border last:border-b-0 ${isExpanded ? "bg-muted/30" : ""}`}>
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") onToggle(); }}
        className="flex cursor-pointer items-center gap-3.5 px-4 py-3.5 transition-colors hover:bg-muted/50 focus:outline-none"
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[13px] font-semibold text-foreground select-none">
          {avatarLetter}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="truncate text-[13.5px] font-medium text-foreground">
              {match.roleTitle || "—"}
            </span>
            <StatusBadge status={match.status} />
          </div>
          <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">
            {[match.companyName, match.locationText, match.source ? formatSourceLabel(normalizeSource(match.source)) : null]
              .filter(Boolean).join(" · ")}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          {actionable ? (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onConvert(match); }}
              disabled={convertingId === match.id}
              className="rounded-[6px] bg-primary px-2.5 py-1.5 text-[11.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {getCreateApplicationButtonLabel(convertingId === match.id)}
            </button>
          ) : (
            <a
              href={match.sourceUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded-[6px] border border-border px-2.5 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted"
            >
              Open ↗
            </a>
          )}
          <span className="select-none text-[11px] text-muted-foreground/50">
            {isExpanded ? "▲" : "▼"}
          </span>
        </div>
      </div>

      {isExpanded ? (
        <div className="border-t border-border bg-background px-4 pb-4 pt-3">
          <a
            href={match.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-[12px] text-primary hover:underline"
          >
            {match.sourceUrl}
          </a>
          <p className="mt-2 text-[12px] text-muted-foreground">
            {VACANCY_MATCH_CONVERSION_COPY.explicitOnly}
          </p>
          <VacancyAnalysisPanel loopId={loopId} matchId={match.id} />
          {applicationFeedback ? (
            <div className="mt-3 flex flex-wrap items-center gap-2 rounded-[10px] border border-border bg-muted/30 p-3 text-[12px] text-muted-foreground">
              <span>{applicationFeedback.message}</span>
              <button
                type="button"
                className="rounded-md border border-border bg-card px-3 py-1 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
                onClick={() => onNavigate(applicationFeedback.applicationId)}
              >
                {VACANCY_MATCH_CONVERSION_COPY.openApplication}
              </button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

function MatchesBody({
  loopId,
  isLoading,
  filtered,
  totalCount,
  expandedId,
  convertingId,
  conversionFeedback,
  onToggle,
  onConvert,
  onNavigate,
  onOpenSources,
}: {
  loopId: string;
  isLoading: boolean;
  filtered: VacancyMatch[];
  totalCount: number;
  expandedId: string | null;
  convertingId: string | null;
  conversionFeedback: Record<string, VacancyMatchConversionFeedback>;
  onToggle: (id: string) => void;
  onConvert: (m: VacancyMatch) => void;
  onNavigate: (appId: string) => void;
  onOpenSources?: () => void;
}) {
  if (isLoading) {
    return (
      <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-b-0">
            <div className="h-9 w-9 shrink-0 animate-pulse rounded-[7px] bg-muted" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 w-48 animate-pulse rounded bg-muted" />
              <div className="h-2.5 w-32 animate-pulse rounded bg-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (totalCount === 0) {
    return (
      <div className="mt-3 rounded-[12px] border border-dashed border-border px-6 py-10 text-center">
        <p className="text-[13px] font-medium text-foreground">{EMPTY_MATCHES_COPY.title}</p>
        <p className="mt-1 text-[12px] text-muted-foreground">{EMPTY_MATCHES_COPY.findManually}</p>
        {onOpenSources ? (
          <button
            type="button"
            onClick={onOpenSources}
            className="mt-3 rounded-[8px] border border-border bg-muted px-4 py-1.5 text-[12px] text-foreground transition-colors hover:bg-muted/70"
          >
            Open sources
          </button>
        ) : null}
      </div>
    );
  }

  if (filtered.length === 0) {
    return (
      <div className="mt-3 rounded-[12px] border border-dashed border-border px-6 py-8 text-center">
        <p className="text-[12.5px] text-muted-foreground">No matches for selected filters.</p>
      </div>
    );
  }

  return (
    <div className="mt-3 overflow-hidden rounded-[12px] border border-border">
      {filtered.map((match) => (
        <MatchRow
          key={match.id}
          loopId={loopId}
          match={match}
          isExpanded={expandedId === match.id}
          convertingId={convertingId}
          applicationFeedback={conversionFeedback[match.id] ?? null}
          onToggle={() => onToggle(match.id)}
          onConvert={onConvert}
          onNavigate={onNavigate}
        />
      ))}
    </div>
  );
}

export function VacancyMatchesSection({ loopId, reloadKey = 0, onAddVacancy, onOpenSources }: Props) {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<VacancyMatch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [convertingId, setConvertingId] = useState<string | null>(null);
  const [conversionFeedback, setConversionFeedback] = useState<Record<string, VacancyMatchConversionFeedback>>({});
  const [error, setError] = useState<string | null>(null);
  const [activeSource, setActiveSource] = useState<string>("all");
  const [activeStatus, setActiveStatus] = useState<StatusTab>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setIsLoading(true);
      setError(null);
      try {
        const envelope = await listLoopVacancyMatchesViaRest(loopId, { limit: 50, offset: 0 });
        if (!cancelled) setMatches(envelope.items);
      } catch (loadError: unknown) {
        if (!cancelled) {
          setMatches([]);
          setError(getErrorMessage(loadError));
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    load().catch((loadError: unknown) => {
      if (!cancelled) setError(getErrorMessage(loadError));
    });

    return () => { cancelled = true; };
  }, [loopId, reloadKey]);

  const sortedMatches = useMemo(
    () => [...matches].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [matches],
  );

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of sortedMatches) {
      const src = normalizeSource(m.source);
      counts.set(src, (counts.get(src) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([key, count]) => ({
      key,
      label: formatSourceLabel(key),
      count,
    }));
  }, [sortedMatches]);

  const statusCounts = useMemo(() => {
    const base = sortedMatches.filter(
      (m) => activeSource === "all" || normalizeSource(m.source) === activeSource,
    );
    const counts: Record<StatusTab, number> = { all: base.length, new: 0, saved: 0, converted: 0 };
    for (const m of base) counts[m.status] = (counts[m.status] ?? 0) + 1;
    return counts;
  }, [sortedMatches, activeSource]);

  const filtered = useMemo(() =>
    sortedMatches.filter((m) => {
      if (activeSource !== "all" && normalizeSource(m.source) !== activeSource) return false;
      if (activeStatus !== "all" && m.status !== activeStatus) return false;
      return true;
    }),
    [sortedMatches, activeSource, activeStatus],
  );

  function handleToggle(id: string) {
    setExpandedId((current) => (current === id ? null : id));
  }

  async function handleConvert(match: VacancyMatch) {
    setConvertingId(match.id);
    setError(null);
    try {
      const result = await createApplicationFromVacancyMatchViaRest(loopId, match.id);
      setMatches((current) => current.map((item) => (item.id === match.id ? result.match : item)));
      setConversionFeedback((current) => ({
        ...current,
        [match.id]: {
          applicationId: result.applicationId,
          message: result.alreadyLinked
            ? VACANCY_MATCH_CONVERSION_COPY.alreadyCreated
            : VACANCY_MATCH_CONVERSION_COPY.created,
        },
      }));
    } catch (convertError: unknown) {
      setError(getErrorMessage(convertError));
    } finally {
      setConvertingId(null);
    }
  }

  function handleNavigate(appId: string) {
    navigate(getApplicationDetailsRoute(appId));
  }

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-semibold text-foreground">Found vacancies</h2>
          {!isLoading && sortedMatches.length > 0 ? (
            <p className="mt-0.5 text-[12.5px] text-muted-foreground">
              {sortedMatches.length} match{sortedMatches.length === 1 ? "" : "es"} across {sources.length} source{sources.length === 1 ? "" : "s"}
            </p>
          ) : null}
        </div>
      </div>

      <SourcesStrip
        sources={sources}
        totalCount={sortedMatches.length}
        activeSource={activeSource}
        onSetSource={setActiveSource}
      />

      <div className="mt-3">
        <StatusTabBar
          tabs={STATUS_TABS}
          counts={statusCounts}
          activeStatus={activeStatus}
          onSetStatus={setActiveStatus}
          onAddVacancy={onAddVacancy}
        />
      </div>

      {error && !isLoading ? (
        <div className="mt-3 rounded-[10px] border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
          {error}
        </div>
      ) : null}

      <MatchesBody
        loopId={loopId}
        isLoading={isLoading}
        filtered={filtered}
        totalCount={sortedMatches.length}
        expandedId={expandedId}
        convertingId={convertingId}
        conversionFeedback={conversionFeedback}
        onToggle={handleToggle}
        onConvert={handleConvert}
        onNavigate={handleNavigate}
        onOpenSources={onOpenSources}
      />
    </section>
  );
}
