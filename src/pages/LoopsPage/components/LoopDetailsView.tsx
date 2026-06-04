import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "src/app/store/hooks";
import { joinTitles } from "src/entities/loop/lib";
import type { Loop, LoopStatus } from "src/entities/loop/model";
import {
  getDiscoverySourceRuntimeStatusViaRest,
  listDiscoveryRunHistoryViaRest,
  type DiscoveryRunHistoryItem,
  type DiscoverySourceRuntimeStatus,
} from "src/features/discoveryRuns";
import {
  archiveLoopViaRest,
  getLoopViaRest,
  listLoopSourceStatsViaRest,
  type LoopSourceStat,
  type SourceHealth,
  updateLoopViaRest,
} from "src/features/loops";
import {
  listLoopVacancyMatchesViaRest,
  type VacancyMatch,
  type VacancyMatchStatus,
} from "src/features/vacancyMatches";
import {
  setLastLoopsUrl,
  setLoopDetailsPage,
} from "src/pages/LoopsPage/model/loopsUiSlice";
import { getErrorMessage } from "src/shared/lib";
import { updateURLParams } from "src/shared/lib/url/updateURLParams";

import { DiscoveryPreviewFeed, type FeedSource } from "./DiscoveryPreviewFeed";
import { CardText } from "./Header";
import {
  DISCOVERY_SOURCE_OPTIONS,
  mergeKnownAndSelectedOptions,
} from "./loopSettingsPanel.helpers";
import {
  buildHeatmap,
  computeConversionRate,
  computeMatchScore,
  countMatchesByStatus,
  countMatchesToday,
  generateLoopRecommendations,
  groupMatchesBySource,
  timeAgoFromIso,
  type LoopRecommendation,
  type TimeAgo,
} from "./loopDetailsView.helpers";
import { LoopSettingsPanel } from "./LoopSettingsPanel";
import { getLoopStatus, isBackendLoopId } from "./loopsPage.helpers";

type TabKey = "overview" | "sources" | "preview" | "history" | "analytics" | "settings";

const SOURCE_COLORS: Record<string, string> = {
  linkedin: "#0a66c2",
  stepstone: "#005c5c",
  indeed: "#2164f3",
  xing: "#006567",
  arbeitsagentur: "#dc2626",
  jobvector: "#1d4ed8",
  joblift: "#1e3a8a",
  kimeta: "#ea580c",
  adzuna: "#7c3aed",
  remotive: "#10b981",
  arbeitnow: "#0f172a",
  remotejobs: "#f97316",
  himalayas: "#0ea5e9",
  remoteok: "#f43f5e",
  greenhouse: "#22c55e",
  lever: "#3b82f6",
  manual_url: "#6b7280",
  company_websites: "#6b7280",
};

function getSourceColor(sourceId: string): string {
  return SOURCE_COLORS[sourceId.toLowerCase()] ?? "#6b7280";
}

interface StatTile {
  label: string;
  value: string | number;
  sub: string;
  accent: boolean;
}

function buildStatTiles(
  t: (key: string, fallback: string, opts?: Record<string, unknown>) => string,
  params: {
    savedTotal: number;
    appliedTotal: number;
    matchesToday: number;
    conversionRate: number | null;
  },
): StatTile[] {
  const { savedTotal, appliedTotal, matchesToday, conversionRate } = params;
  const appliedPct =
    savedTotal > 0
      ? t("loops.statAppliedPct", "{{value}}% of saved", {
          value: Math.round((appliedTotal / savedTotal) * 100),
        })
      : t("loops.dash", "—");
  return [
    { label: t("loops.statMatches", "Matches"), value: savedTotal, sub: t("loops.statMatchesSub", "Saved matches"), accent: false },
    { label: t("loops.statApplied", "Applied"), value: appliedTotal, sub: appliedPct, accent: true },
    { label: t("loops.statToday", "Today"), value: matchesToday, sub: t("loops.statTodaySub", "New today"), accent: false },
    { label: t("loops.statConversion", "Conversion"), value: conversionRate !== null ? `${conversionRate}%` : "—", sub: t("loops.statConversionSub", "Saved → applied"), accent: false },
  ];
}

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
  ];

  return raw.filter((chip) => chip.value && chip.value !== "—");
}

const MATCH_STATUS_STYLES: Record<VacancyMatchStatus, { key: string; cls: string }> = {
  new:       { key: "loops.statusNew",       cls: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" },
  saved:     { key: "loops.statusSaved",     cls: "bg-muted text-muted-foreground" },
  ignored:   { key: "loops.statusIgnored",   cls: "bg-muted text-muted-foreground opacity-60" },
  converted: { key: "loops.statusConverted", cls: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300" },
};

function getStatusBadgeClass(status: LoopStatus): string {
  if (status === "archived") return "bg-muted text-muted-foreground";
  if (status === "paused") return "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400";
}

function LoopStatusBadge({ status }: { status: LoopStatus }) {
  const { t } = useTranslation();
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${getStatusBadgeClass(status)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" aria-hidden="true" />
      {t(`loops.${status}`)}
    </span>
  );
}

function RecommendationCard({
  rec,
  onDismiss,
}: {
  rec: LoopRecommendation;
  onDismiss: () => void;
}) {
  return (
    <div
      className="rounded-[12px] border p-4"
      style={{
        borderColor: "color-mix(in oklab, rgb(var(--primary, 5 150 105)) 25%, rgb(229 229 229))",
        background:
          "linear-gradient(135deg, color-mix(in oklab, rgb(var(--primary, 5 150 105)) 6%, transparent), transparent)",
      }}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className="grid h-5 w-5 place-items-center rounded text-[11px]"
          style={{
            background:
              "color-mix(in oklab, rgb(var(--primary, 5 150 105)) 14%, transparent)",
            color: "rgb(var(--primary, 5 150 105))",
          }}
          aria-hidden="true"
        >
          ✨
        </span>
        <span className="text-[11px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
          Рекомендация
        </span>
      </div>
      <div className="text-[13px] leading-snug text-foreground">
        <strong className="font-semibold">{rec.title}</strong>
        {rec.body ? <span className="text-muted-foreground"> — {rec.body}</span> : null}
      </div>
      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2 py-1 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          Скрыть
        </button>
      </div>
    </div>
  );
}

function NextRunCountdown({ nextRunAt }: { nextRunAt: string | null | undefined }) {
  const { t } = useTranslation();
  if (!nextRunAt) {
    return (
      <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em] text-muted-foreground">
        {t("loops.nextSyncPending", "Ожидание запуска")}
      </div>
    );
  }
  const diffMs = Date.parse(nextRunAt) - Date.now();
  if (diffMs <= 0) {
    return (
      <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em] text-foreground">
        {t("loops.nextSyncOverdue", "Sync pending")}
      </div>
    );
  }
  const totalMin = Math.ceil(diffMs / 60_000);
  const showHours = totalMin >= 60;
  const value = showHours ? Math.round(totalMin / 60) : totalMin;
  const unitKey = showHours ? "loops.unitHours" : "loops.unitMinutes";
  const unitFallback = showHours ? "ч" : "мин";
  return (
    <div className="mt-2 flex items-baseline gap-1.5 leading-none tracking-[-0.04em] text-foreground">
      <span className="text-[30px] font-semibold tabular-nums">{value}</span>
      <span className="text-[14px] font-normal text-muted-foreground">
        {t(unitKey, unitFallback)}
      </span>
    </div>
  );
}

function useTimeAgoLabel() {
  const { t } = useTranslation();
  return (ago: TimeAgo | null): string => {
    if (!ago) return t("loops.never", "Никогда");
    if (ago.unit === "now") return t("loops.now", "только что");
    if (ago.unit === "minute") return t("loops.minutesAgo", "{{value}} мин назад", { value: ago.value });
    if (ago.unit === "hour") return t("loops.hoursAgo", "{{value}} ч назад", { value: ago.value });
    return t("loops.daysAgo", "{{value}} д назад", { value: ago.value });
  };
}

// ─── Overview tab ────────────────────────────────────────────────────────────

function LoopOverviewTab({
  loop,
  matches,
  matchesLoading,
  onOpenMatches,
  sourceStats,
  sourceStatsLoading,
}: {
  loop: Loop;
  matches: VacancyMatch[];
  matchesLoading: boolean;
  onOpenMatches?: (id: string) => void;
  sourceStats: LoopSourceStat[];
  sourceStatsLoading: boolean;
}) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgoLabel();

  const chips = buildLoopChips(loop, {
    role: t("loops.chipRole", "Role"),
    location: t("loops.chipLocation", "Location"),
    radius: t("loops.chipRadius", "Radius"),
    mode: t("loops.chipMode", "Work mode"),
    remote: t("loops.remoteOnly", "Remote only"),
    any: t("loops.any", "Any"),
    employment: t("loops.chipEmployment", "Employment"),
  });

  const includeKw = (loop.filters?.includeKeywords || loop.keywords?.join(", ") || "")
    .split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);
  const excludeKw = (loop.filters?.excludeKeywords || loop.excludedKeywords?.join(", ") || "")
    .split(/[,\s]+/).map((k) => k.trim()).filter(Boolean);

  const topMatches = useMemo(
    () =>
      matches
        .filter((m) => m.status === "new" || m.status === "saved")
        .map((m) => ({ match: m, score: computeMatchScore(m, loop) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5),
    [matches, loop],
  );

  const heatmap = useMemo(() => buildHeatmap(matches, 30), [matches]);
  const heatmapMax = Math.max(1, ...heatmap);
  const heatmapAvg = (heatmap.reduce((a, v) => a + v, 0) / heatmap.length).toFixed(1);

  const sourceBuckets = useMemo(() => groupMatchesBySource(matches), [matches]);
  // Render every source that is either configured for the loop OR has produced
  // a match — otherwise a match from a source not in `selectedSources`
  // (e.g. a remote board) would be invisible here while still counting toward
  // the total "МАТЧИ" tile, making the rail look inconsistent (3 vs 4).
  const displaySources = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const src of loop.selectedSources ?? []) {
      const key = src.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      result.push(src);
    }
    for (const bucket of sourceBuckets) {
      if (seen.has(bucket.source)) continue;
      seen.add(bucket.source);
      result.push(bucket.source);
    }
    return result;
  }, [loop.selectedSources, sourceBuckets]);
  const lastSyncAgo = formatTimeAgo(timeAgoFromIso(loop.lastDiscoveryAt));

  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  const recommendations = useMemo(
    () => generateLoopRecommendations(loop, matches, sourceStats),
    [loop, matches, sourceStats],
  );
  const activeRecommendation = recommendations.find((r) => !dismissedRecs.has(r.id)) ?? null;

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="flex min-w-0 flex-col gap-4">
        {/* Filters card */}
        <div className="rounded-[12px] border border-border bg-card p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-[13px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
                {t("loops.searchParams", "Search parameters")}
              </h2>
              <p className="mt-1 text-[12px] text-muted-foreground">
                {t("loops.searchParamsHint", "Used to query vacancies across all sources")}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {chips.map((chip) => (
              <FilterChip key={chip.label} label={chip.label} value={chip.value} />
            ))}
          </div>

          {(includeKw.length > 0 || excludeKw.length > 0) && (
            <div className="mt-4 flex flex-col gap-2 border-t border-border pt-4">
              {includeKw.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11.5px] text-muted-foreground">
                    {t("loops.include", "Include:")}
                  </span>
                  {includeKw.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border px-2 py-0.5 text-[11.5px]"
                      style={{
                        background: "color-mix(in oklab, rgb(5,150,105) 10%, transparent)",
                        borderColor: "color-mix(in oklab, rgb(5,150,105) 25%, transparent)",
                        color: "rgb(5,150,105)",
                      }}
                    >
                      + {k}
                    </span>
                  ))}
                </div>
              )}
              {excludeKw.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11.5px] text-muted-foreground">
                    {t("loops.exclude", "Exclude:")}
                  </span>
                  {excludeKw.map((k) => (
                    <span
                      key={k}
                      className="rounded-full border px-2 py-0.5 text-[11.5px]"
                      style={{
                        background: "color-mix(in oklab, rgb(220,38,38) 10%, transparent)",
                        borderColor: "color-mix(in oklab, rgb(220,38,38) 22%, transparent)",
                        color: "rgb(220,38,38)",
                      }}
                    >
                      − {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Top matches */}
        {topMatches.length > 0 && (
          <div className="overflow-hidden rounded-[12px] border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
              <div>
                <div className="text-[13px] font-medium text-foreground">
                  {t("loops.topMatches", "Top matches in this loop")}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {t("loops.topMatchesSub", "Most recent actionable matches")}
                </div>
              </div>
              {onOpenMatches && (
                <button
                  type="button"
                  onClick={() => onOpenMatches(loop.id)}
                  className="text-[12px] text-muted-foreground transition-colors hover:text-foreground"
                >
                  {t("loops.allMatches", "All matches")} →
                </button>
              )}
            </div>
            <div className="divide-y divide-border">
              {topMatches.map(({ match: m, score }) => {
                const company = m.companyName ?? "—";
                const statusStyle = MATCH_STATUS_STYLES[m.status] ?? MATCH_STATUS_STYLES.new;
                const barColor =
                  score >= 90
                    ? "rgb(5,150,105)"
                    : score >= 80
                      ? "rgb(var(--primary, 5 150 105))"
                      : "rgb(148,163,184)";
                return (
                  <a
                    key={m.id}
                    href={m.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="grid grid-cols-[28px_minmax(0,1fr)_minmax(0,0.7fr)_auto_88px_20px] items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border border-border bg-muted text-[11px] font-semibold text-muted-foreground">
                      {company.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] font-medium text-foreground">
                        {m.roleTitle ?? "—"}
                      </div>
                      <div className="truncate text-[11px] text-muted-foreground">
                        {company}{m.locationText ? ` · ${m.locationText}` : ""}
                      </div>
                    </div>
                    <div className="flex min-w-0 items-center gap-1.5 text-[11.5px] text-muted-foreground">
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-[2px]"
                        style={{ background: getSourceColor(m.source ?? "") }}
                        aria-hidden="true"
                      />
                      <span className="truncate">{m.source ?? "—"}</span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${statusStyle.cls}`}>
                      {t(statusStyle.key)}
                    </span>
                    <div className="flex items-center gap-1.5 justify-self-end">
                      <div className="h-1 w-9 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${score}%`, background: barColor }}
                        />
                      </div>
                      <span className="text-[11.5px] font-medium tabular-nums text-foreground">
                        {score}
                      </span>
                    </div>
                    <span className="text-[13px] text-muted-foreground">→</span>
                  </a>
                );
              })}
            </div>
          </div>
        )}

        {/* Activity heatmap (derived from match created_at) */}
        <div className="rounded-[12px] border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {t("loops.activityHeatmap", "Loop activity")}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {t("loops.activityHeatmapSub", "Matches found per day · last 30 days")}
              </div>
            </div>
            <span className="text-[11.5px] text-muted-foreground">
              {t("loops.activityAvg", "Avg · {{value}}/day", { value: heatmapAvg })}
            </span>
          </div>
          <div className="grid grid-cols-30 gap-[3px]" style={{ gridTemplateColumns: "repeat(30, 1fr)" }}>
            {heatmap.map((v, i) => {
              const opacity = v / heatmapMax;
              return (
                <div
                  key={i}
                  className="aspect-square rounded-[3px]"
                  style={{
                    background:
                      v === 0
                        ? "var(--muted, rgb(245 245 245))"
                        : `color-mix(in oklab, var(--primary, rgb(5 150 105)) ${30 + opacity * 70}%, transparent)`,
                    border: v === 0 ? "1px solid var(--border, rgb(229 229 229))" : "1px solid transparent",
                  }}
                  title={`${v}`}
                />
              );
            })}
          </div>
          {matchesLoading && !matches.length ? (
            <p className="mt-3 text-[11.5px] text-muted-foreground">
              {t("loops.loadingMatches", "Loading matches…")}
            </p>
          ) : null}
        </div>
      </div>

      {/* Right rail */}
      <aside className="flex min-w-0 flex-col gap-4">
        {/* Sources health */}
        <div className="rounded-[12px] border border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
              {t("loops.chipSources", "Sources")}
            </span>
            <span className="text-[11px] text-muted-foreground">
              {displaySources.length}
            </span>
          </div>
          <ul className="mt-3 flex flex-col">
            {displaySources.slice(0, 10).map((src) => {
              const key = src.toLowerCase();
              const stat = sourceStats.find((s) => s.sourceId.toLowerCase() === key);
              const bucket = sourceBuckets.find((b) => b.source === key);
              const count = stat?.matches ?? bucket?.total ?? 0;
              const health: SourceHealth = sourceStatsLoading
                ? "never"
                : (stat?.health ?? "never");
              return (
                <li
                  key={src}
                  className="flex items-center gap-2 border-b border-border/60 py-1.5 last:border-b-0"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-[2px]"
                    style={{ background: getSourceColor(src) }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate text-[12.5px] font-medium text-foreground">
                    {src}
                  </span>
                  {health === "error" ? (
                    <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                      {t("loops.sourceHealth_error", "ошибка")}
                    </span>
                  ) : health === "warning" ? (
                    <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {t("loops.sourceHealth_warning", "медленно")}
                    </span>
                  ) : null}
                  <span className="shrink-0 text-[11.5px] tabular-nums text-muted-foreground">
                    {count}
                  </span>
                </li>
              );
            })}
            {displaySources.length === 0 && (
              <li className="py-2 text-[12px] text-muted-foreground">
                {t("loops.sourcesEmpty", "No sources selected yet.")}
              </li>
            )}
          </ul>
        </div>

        {/* Next sync widget */}
        {loop.autoDiscoveryEnabled ? (
          <div className="rounded-[12px] border border-border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
              {t("loops.nextSyncTitle", "Следующий запуск")}
            </span>
            <NextRunCountdown nextRunAt={loop.nextRunAt} />
            <div className="mt-2 text-[11.5px] text-muted-foreground/80">
              {t("loops.autoDiscoveryEvery", "Автоматически каждые {{n}} часов", {
                n: loop.discoveryIntervalHours ?? 24,
              })}
            </div>
            {loop.lastDiscoveryAt ? (
              <div className="mt-3 rounded-[8px] bg-muted/50 p-2.5 text-[11px] leading-relaxed text-muted-foreground">
                {t("loops.lastSyncSummary", "Последний запуск · {{value}}", {
                  value: lastSyncAgo,
                })}
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-[12px] border border-border bg-card p-4">
            <span className="text-[11px] font-medium uppercase tracking-[0.07em] text-muted-foreground/70">
              {t("loops.lastSync", "Last sync")}
            </span>
            <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em] text-foreground">
              {lastSyncAgo}
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-muted-foreground">
              {t(
                "loops.manualRunHint",
                "Automatic scheduling is not enabled yet — run a search manually from the Sources tab.",
              )}
            </p>
          </div>
        )}

        {activeRecommendation ? (
          <RecommendationCard
            rec={activeRecommendation}
            onDismiss={() =>
              setDismissedRecs((prev) => {
                const next = new Set(prev);
                next.add(activeRecommendation.id);
                return next;
              })
            }
          />
        ) : null}
      </aside>
    </div>
  );
}

// ─── Source health badge ──────────────────────────────────────────────────────

const HEALTH_STYLES: Record<SourceHealth, { dot: string; label: string }> = {
  ok:      { dot: "bg-emerald-500", label: "text-emerald-600 dark:text-emerald-400" },
  warning: { dot: "bg-amber-400",   label: "text-amber-600 dark:text-amber-400" },
  error:   { dot: "bg-rose-500",    label: "text-rose-600 dark:text-rose-400" },
  never:   { dot: "bg-muted-foreground/30", label: "text-muted-foreground/60" },
};

function HealthBadge({ health }: { health: SourceHealth }) {
  const { t } = useTranslation();
  const s = HEALTH_STYLES[health];
  const labelKey = `loops.sourceHealth_${health}`;
  const fallback =
    health === "ok" ? "OK" : health === "warning" ? "Warning" : health === "error" ? "Error" : "—";
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${s.dot}`} />
      <span className={`text-[11px] font-medium ${s.label}`}>{t(labelKey, fallback)}</span>
    </span>
  );
}

// ─── Sources tab ─────────────────────────────────────────────────────────────

function LoopSourcesTab({
  loop,
  matches,
  sourceStats,
  sourceStatsLoading,
  onRefreshSourceStats,
  onLoopUpdated,
}: {
  loop: Loop;
  matches: VacancyMatch[];
  sourceStats: LoopSourceStat[];
  sourceStatsLoading: boolean;
  onRefreshSourceStats: () => void;
  onLoopUpdated: (loop: Loop) => void;
}) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgoLabel();
  const sources = loop.selectedSources ?? [];
  const buckets = useMemo(() => groupMatchesBySource(matches), [matches]);

  // Source currently mid-flight to the backend (disable its toggle until done).
  const [pendingSource, setPendingSource] = useState<string | null>(null);
  const [toggleError, setToggleError] = useState<string | null>(null);

  const enabledSet = useMemo(
    () => new Set(sources.map((s) => s.toLowerCase())),
    [sources],
  );

  // Render every known source plus any selected-but-unknown ones, so a source
  // can be toggled back on after it was switched off (it must not vanish).
  const allOptions = useMemo(
    () => mergeKnownAndSelectedOptions(DISCOVERY_SOURCE_OPTIONS, sources),
    [sources],
  );

  const statBySource = useMemo(
    () => new Map(sourceStats.map((s) => [s.sourceId.toLowerCase(), s])),
    [sourceStats],
  );

  const handleToggle = useCallback(
    async (value: string) => {
      if (pendingSource) return;
      // Operate on canonical lowercase ids: stored sources may preserve mixed
      // casing, but option values are always lowercase, so a case-sensitive
      // toggle could fail to remove an enabled source (and duplicate it).
      const lowerValue = value.toLowerCase();
      const current = sources.map((s) => s.toLowerCase());
      const nextSources = current.includes(lowerValue)
        ? current.filter((s) => s !== lowerValue)
        : [...current, lowerValue];
      setPendingSource(value);
      setToggleError(null);
      try {
        const updated = await updateLoopViaRest(loop.id, { selectedSources: nextSources });
        onLoopUpdated(updated);
        onRefreshSourceStats();
      } catch (err) {
        setToggleError(getErrorMessage(err));
      } finally {
        setPendingSource(null);
      }
    },
    [loop.id, sources, pendingSource, onLoopUpdated, onRefreshSourceStats],
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="text-[13.5px] font-medium text-foreground">
              {t("loops.sourcesTitle", "Sources for this loop")}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {t(
                "loops.sourcesToggleSubtitle",
                "Включи источники, по которым этот луп будет искать вакансии.",
              )}
            </div>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            {t("loops.sourcesEnabledCount", "{{enabled}} / {{total}}", {
              enabled: enabledSet.size,
              total: allOptions.length,
            })}
          </span>
        </div>
        {toggleError ? (
          <div className="border-b border-border bg-rose-50 px-5 py-2 text-[11.5px] text-rose-700 dark:bg-rose-900/20 dark:text-rose-300">
            {toggleError}
          </div>
        ) : null}
        <ul className="divide-y divide-border">
          {allOptions.map((option) => {
            const key = option.value.toLowerCase();
            const enabled = enabledSet.has(key);
            const isPending = pendingSource === option.value;
            const stat = statBySource.get(key);
            const bucket = buckets.find((b) => b.source === key);
            const matchesCount = stat?.matches ?? bucket?.total ?? 0;
            const convertedCount = stat?.applied ?? bucket?.converted ?? 0;
            const convPct =
              matchesCount > 0 ? Math.round((convertedCount / matchesCount) * 100) : null;
            const health: SourceHealth = sourceStatsLoading
              ? "never"
              : (stat?.health ?? "never");
            const lastRunLabel = sourceStatsLoading
              ? "…"
              : stat?.lastRunAt
                ? formatTimeAgo(timeAgoFromIso(stat.lastRunAt))
                : t("loops.sourceNeverRun", "Never run");
            const label = option.label;
            return (
              <li
                key={option.value}
                className={[
                  "grid grid-cols-[36px_minmax(0,1.6fr)_repeat(3,minmax(0,0.8fr))_auto] items-center gap-4 px-5 py-3 transition-opacity",
                  enabled ? "" : "opacity-60",
                ].join(" ")}
              >
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-[7px] text-[12px] font-bold uppercase text-white"
                  style={{ background: getSourceColor(option.value) }}
                  aria-hidden="true"
                >
                  {label.charAt(0)}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-[13.5px] font-medium text-foreground">
                      {label}
                    </span>
                    {!enabled ? (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {t("loops.sourceDisabled", "Выключен")}
                      </span>
                    ) : health === "ok" ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                        {t("loops.sourceStatusOnline", "● Онлайн")}
                      </span>
                    ) : health === "warning" ? (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                        {t("loops.sourceStatusSlow", "Медленно")}
                      </span>
                    ) : health === "error" ? (
                      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10.5px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
                        {t("loops.sourceStatusError", "Ошибка")}
                      </span>
                    ) : (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
                        {t("loops.sourceStatusNever", "Не запускался")}
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    {enabled
                      ? t("loops.sourceLastPoll", "Последний опрос · {{value}}", {
                          value: lastRunLabel,
                        })
                      : t("loops.sourceDisabledHint", "Поиск по этому источнику отключён")}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                    {t("loops.sourceMatches", "Matches")}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
                    {matchesCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                    {t("loops.sourceConverted", "Applied")}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
                    {convertedCount}
                  </div>
                </div>
                <div>
                  <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                    {t("loops.sourceConvRate", "Конв.")}
                  </div>
                  <div className="mt-0.5 text-[14px] font-semibold tabular-nums text-foreground">
                    {convPct !== null ? `${convPct}%` : "—"}
                  </div>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={enabled}
                  aria-label={t("loops.sourceToggleAria", "Включить источник {{label}}", {
                    label,
                  })}
                  disabled={isPending}
                  onClick={() => handleToggle(option.value)}
                  className={[
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                    enabled ? "bg-sky-600" : "bg-muted",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-lg transition-transform",
                      enabled ? "translate-x-5" : "translate-x-0",
                    ].join(" ")}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function LoopPreviewTab({
  loop,
  onRefreshSourceStats,
}: {
  loop: Loop;
  onRefreshSourceStats: () => void;
}) {
  const isBackendId = isBackendLoopId(loop.id);
  const sources = loop.selectedSources ?? [];
  const [runtimeStatuses, setRuntimeStatuses] = useState<DiscoverySourceRuntimeStatus[]>([]);
  const [runtimeStatusesLoading, setRuntimeStatusesLoading] = useState(isBackendId);

  useEffect(() => {
    if (!isBackendId) return;
    let cancelled = false;
    setRuntimeStatusesLoading(true);
    getDiscoverySourceRuntimeStatusViaRest()
      .then((res) => {
        if (!cancelled) setRuntimeStatuses(res.items);
      })
      .catch(() => {
        if (!cancelled) setRuntimeStatuses([]);
      })
      .finally(() => {
        if (!cancelled) setRuntimeStatusesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isBackendId]);

  const runnableSources = useMemo<FeedSource[]>(() => {
    if (runtimeStatusesLoading) return [];
    const runnableSet = new Set(
      runtimeStatuses.filter((s) => s.runnable).map((s) => s.sourceId.toLowerCase()),
    );
    return sources
      .filter((src) => runnableSet.has(src.toLowerCase()))
      .map((src) => ({
        sourceId: src.toLowerCase(),
        label:
          DISCOVERY_SOURCE_OPTIONS.find((o) => o.value === src.toLowerCase())?.label ?? src,
      }));
  }, [sources, runtimeStatuses, runtimeStatusesLoading]);

  if (!isBackendId) return null;
  if (runtimeStatusesLoading) {
    return <div className="text-[12px] text-muted-foreground">Проверяем источники…</div>;
  }
  if (runnableSources.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-card p-5 text-[12.5px] text-muted-foreground">
        Нет источников с поддержкой автоматического поиска. Добавь Arbeitsagentur, Remotive,
        Arbeit Now или другой поддерживаемый источник в настройках.
      </div>
    );
  }
  return (
    <DiscoveryPreviewFeed
      loopId={loop.id}
      sources={runnableSources}
      onMatchSaved={() => {}}
      onRunComplete={onRefreshSourceStats}
    />
  );
}

// ─── History tab (empty state, Stage 2) ──────────────────────────────────────

const HISTORY_STATUS_STYLES: Record<string, string> = {
  completed: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  completed_with_warnings: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  failed: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300",
  skipped: "bg-muted text-muted-foreground",
};

function HistoryRow({ row }: { row: DiscoveryRunHistoryItem }) {
  const { t } = useTranslation();
  const statusCls = HISTORY_STATUS_STYLES[row.status] ?? HISTORY_STATUS_STYLES.skipped;
  const startedDate = new Date(row.startedAt);
  const isLastDot = row.status === "failed";

  return (
    <li
      className={`grid grid-cols-[120px_18px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-3 ${
        row.status === "failed" ? "bg-rose-50/40 dark:bg-rose-950/10" : ""
      }`}
    >
      <div className="pt-0.5">
        <div className="text-[12px] font-medium tabular-nums text-foreground">
          {startedDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="text-[11px] text-muted-foreground">
          {startedDate.toLocaleDateString()}
        </div>
      </div>
      <div className="flex h-full justify-center pt-1.5">
        <span
          className="h-2.5 w-2.5 shrink-0 rounded-full"
          style={{
            background: isLastDot ? "rgb(220,38,38)" : "rgb(5,150,105)",
            border: `2px solid color-mix(in oklab, ${isLastDot ? "rgb(220,38,38)" : "rgb(5,150,105)"} 22%, transparent)`,
          }}
        />
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] font-medium text-foreground">
            {row.status === "failed"
              ? t("loops.historyRowFailed", "Run failed")
              : t("loops.historyRowFound", "Found {{count}} items", { count: row.itemsFound })}
          </span>
          <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-medium ${statusCls}`}>
            {t(`loops.historyStatus_${row.status}`, row.status)}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {Math.round(row.durationMs / 100) / 10}s
          </span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          {row.sources.length === 0 ? (
            <span className="text-[11px] text-muted-foreground">
              {t("loops.historyRowNoSources", "no sources")}
            </span>
          ) : (
            row.sources.map((src) => (
              <span
                key={src}
                className="rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10.5px] text-muted-foreground"
              >
                {src}
              </span>
            ))
          )}
        </div>
        {row.errorText ? (
          <p className="mt-1.5 font-mono text-[11px] leading-relaxed text-rose-600 dark:text-rose-400">
            {row.errorText}
          </p>
        ) : null}
      </div>
      <div className="text-[11px] text-muted-foreground tabular-nums">
        {row.itemsNew > 0
          ? t("loops.historyRowNew", "+{{count}} new", { count: row.itemsNew })
          : null}
      </div>
    </li>
  );
}

function LoopHistoryTab({ loop }: { loop: Loop }) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgoLabel();
  const lastAgo = formatTimeAgo(timeAgoFromIso(loop.lastDiscoveryAt));
  const isBackendId = isBackendLoopId(loop.id);
  const [history, setHistory] = useState<DiscoveryRunHistoryItem[]>([]);
  const [loading, setLoading] = useState(isBackendId);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isBackendId) return;
    let cancelled = false;
    setLoading(true);
    listDiscoveryRunHistoryViaRest({ loopId: loop.id, limit: 50 })
      .then((envelope) => {
        if (!cancelled) {
          setHistory(envelope.items);
          setError(null);
        }
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setHistory([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [loop.id, isBackendId]);

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-[12px] border border-border bg-card p-5">
        <div className="text-[13.5px] font-medium text-foreground">
          {t("loops.historyLastSyncTitle", "Last discovery sync")}
        </div>
        <div className="mt-1 text-[20px] font-semibold tracking-[-0.025em] text-foreground">
          {lastAgo}
        </div>
        <p className="mt-2 text-[12px] leading-relaxed text-muted-foreground">
          {loop.lastDiscoveryAt
            ? new Date(loop.lastDiscoveryAt).toLocaleString()
            : t("loops.historyNeverRun", "This loop has never run a discovery sync.")}
        </p>
      </div>

      <div className="overflow-hidden rounded-[12px] border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
          <div>
            <div className="text-[13.5px] font-medium text-foreground">
              {t("loops.historyTimelineTitle", "Run history")}
            </div>
            <div className="mt-0.5 text-[11.5px] text-muted-foreground">
              {t("loops.historyTimelineSub", "Chronological log of discovery runs for this loop")}
            </div>
          </div>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
            {history.length}
          </span>
        </div>

        {loading ? (
          <div className="px-5 py-6 text-[12.5px] text-muted-foreground">
            {t("loops.loading", "Loading…")}
          </div>
        ) : error ? (
          <div className="px-5 py-6 text-[12.5px] text-rose-600 dark:text-rose-400">
            {error}
          </div>
        ) : history.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-[16px]">
              ↻
            </div>
            <div className="text-[13px] font-medium text-foreground">
              {t("loops.historyEmptyShort", "No runs yet")}
            </div>
            <p className="mx-auto mt-1 max-w-md text-[12px] leading-relaxed text-muted-foreground">
              {t(
                "loops.historyEmptyHint",
                "Trigger a manual run from the Sources tab — entries will appear here as soon as the first run completes.",
              )}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {history.map((row) => (
              <HistoryRow key={row.id} row={row} />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

// ─── Analytics tab ───────────────────────────────────────────────────────────

function LoopAnalyticsTab({
  loop,
  matches,
}: {
  loop: Loop;
  matches: VacancyMatch[];
}) {
  const { t } = useTranslation();
  const counts = useMemo(() => countMatchesByStatus(matches), [matches]);
  const buckets = useMemo(() => groupMatchesBySource(matches), [matches]);
  const total = counts.new + counts.saved + counts.converted + counts.ignored;
  const metrics = loop.metrics;
  const applications = metrics?.applications_total ?? counts.converted;
  const saved = metrics?.matches_saved ?? counts.saved + counts.converted;
  const applied = metrics?.applied_count ?? counts.converted;
  const interviews = metrics?.interview_count ?? 0;
  const offers = metrics?.offer_count ?? 0;
  const conv = computeConversionRate(saved, applications);

  const funnel: { key: string; label: string; value: number }[] = [
    { key: "found",     label: t("loops.funnelFound",     "Found"),     value: total },
    { key: "saved",     label: t("loops.funnelSaved",     "Saved"),     value: saved },
    { key: "applied",   label: t("loops.funnelApplied",   "Applied"),   value: applied },
    { key: "interview", label: t("loops.funnelInterview", "Interview"), value: interviews },
    { key: "offer",     label: t("loops.funnelOffer",     "Offer"),     value: offers },
  ];
  const funnelMax = Math.max(1, ...funnel.map((s) => s.value));

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        {/* Funnel */}
        <div className="rounded-[12px] border border-border bg-card p-5">
          <div className="mb-3 flex items-baseline justify-between">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {t("loops.funnelTitle", "Loop funnel")}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {t("loops.funnelSubtitle", "From discovered match to application")}
              </div>
            </div>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
              {t("loops.funnelScope", "This loop")}
            </span>
          </div>
          <div className="flex flex-col gap-3">
            {funnel.map((s, i) => {
              const next = funnel[i + 1];
              const stepConv = next && s.value > 0 ? Math.round((next.value / s.value) * 100) : null;
              return (
                <div key={s.key}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="font-medium text-foreground">{s.label}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {s.value}
                      {stepConv !== null ? <span className="ml-2">→ {stepConv}%</span> : null}
                    </span>
                  </div>
                  <div className="h-5 overflow-hidden rounded-[4px] border border-border bg-muted">
                    <div
                      className="h-full bg-primary/70 transition-[width]"
                      style={{ width: `${Math.max(2, Math.round((s.value / funnelMax) * 100))}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          {metrics ? (
            <div className="mt-4 grid grid-cols-3 gap-3 rounded-[8px] bg-muted/50 p-3 text-[11.5px]">
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                  {t("loops.responseRate", "Response")}
                </div>
                <div className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">
                  {Math.round((metrics.response_rate ?? 0) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                  {t("loops.interviewRate", "Interview")}
                </div>
                <div className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">
                  {Math.round((metrics.interview_rate ?? 0) * 100)}%
                </div>
              </div>
              <div>
                <div className="text-[10.5px] font-medium uppercase tracking-[0.04em] text-muted-foreground/70">
                  {t("loops.offerRate", "Offer")}
                </div>
                <div className="mt-1 text-[14px] font-semibold tabular-nums text-foreground">
                  {Math.round((metrics.offer_rate ?? 0) * 100)}%
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Per-source conversion */}
        <div className="rounded-[12px] border border-border bg-card p-5">
          <div className="text-[13px] font-medium text-foreground">
            {t("loops.bySource", "Matches by source")}
          </div>
          <div className="mt-0.5 text-[11.5px] text-muted-foreground">
            {t("loops.bySourceSub", "Distribution of saved matches across sources")}
          </div>
          <div className="mt-3 flex flex-col gap-3">
            {buckets.length === 0 && (
              <p className="text-[12px] text-muted-foreground">
                {t("loops.bySourceEmpty", "No matches yet.")}
              </p>
            )}
            {buckets.map((b) => {
              const share = total > 0 ? Math.round((b.total / total) * 100) : 0;
              return (
                <div key={b.source}>
                  <div className="mb-1 flex items-baseline justify-between text-[12px]">
                    <span className="font-medium text-foreground">{b.source}</span>
                    <span className="tabular-nums text-muted-foreground">
                      {b.total}
                      <span className="ml-2">· {share}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary/60" style={{ width: `${Math.max(2, share)}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="rounded-[12px] border border-dashed border-border bg-card/50 p-4 text-[12px] leading-relaxed text-muted-foreground">
        {t(
          "loops.analyticsStageNote",
          "Per-source conversion (reply → interview → offer) and weekly dynamics arrive in backend stage 3.",
        )}
        {conv !== null ? (
          <span className="ml-2 text-foreground">
            {t("loops.savedToApplied", "Saved → Applied: {{value}}%", { value: conv })}
          </span>
        ) : null}
      </div>
    </div>
  );
}

// ─── Page shell ──────────────────────────────────────────────────────────────

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
  const [sourceStats, setSourceStats] = useState<LoopSourceStat[]>([]);
  const [sourceStatsLoading, setSourceStatsLoading] = useState(false);
  const [sourceStatsRefreshKey, setSourceStatsRefreshKey] = useState(0);
  const formatTimeAgo = useTimeAgoLabel();

  const handleRefreshSourceStats = useCallback(() => {
    setSourceStatsRefreshKey((k) => k + 1);
  }, []);

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
  }, [loopId]);

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

function LoopDetailContent({
  isLoadingLoop,
  loopError,
  loop,
  activeTab,
  matches,
  matchesLoading,
  sourceStats,
  sourceStatsLoading,
  onRefreshSourceStats,
  isArchived,
  status,
  onOpenMatches,
  onPauseResume,
  onArchive,
  onLoopUpdated,
}: {
  isLoadingLoop: boolean;
  loopError: string | null;
  loop: Loop | null;
  activeTab: TabKey;
  matches: VacancyMatch[];
  matchesLoading: boolean;
  sourceStats: LoopSourceStat[];
  sourceStatsLoading: boolean;
  onRefreshSourceStats: () => void;
  isArchived: boolean;
  status: LoopStatus;
  onOpenMatches?: (id: string) => void;
  onPauseResume: () => Promise<void>;
  onArchive: () => Promise<void>;
  onLoopUpdated: (loop: Loop) => void;
}) {
  const { t } = useTranslation();

  if (isLoadingLoop) return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
  if (loopError) return <CardText>{loopError}</CardText>;
  if (!loop) return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;

  if (activeTab === "settings") {
    return (
      <LoopSettingsPanel
        loop={loop}
        onSave={async (patch) => {
          const updated = await updateLoopViaRest(loop.id, patch);
          onLoopUpdated(updated);
          return updated;
        }}
        isPaused={status === "paused"}
        onPauseResume={isArchived ? undefined : onPauseResume}
        onArchive={isArchived ? undefined : onArchive}
      />
    );
  }
  if (activeTab === "sources")
    return (
      <LoopSourcesTab
        loop={loop}
        matches={matches}
        sourceStats={sourceStats}
        sourceStatsLoading={sourceStatsLoading}
        onRefreshSourceStats={onRefreshSourceStats}
        onLoopUpdated={onLoopUpdated}
      />
    );
  if (activeTab === "preview")
    return <LoopPreviewTab loop={loop} onRefreshSourceStats={onRefreshSourceStats} />;
  if (activeTab === "history")   return <LoopHistoryTab loop={loop} />;
  if (activeTab === "analytics") return <LoopAnalyticsTab loop={loop} matches={matches} />;
  return (
    <LoopOverviewTab
      loop={loop}
      matches={matches}
      matchesLoading={matchesLoading}
      onOpenMatches={onOpenMatches}
      sourceStats={sourceStats}
      sourceStatsLoading={sourceStatsLoading}
    />
  );
}
