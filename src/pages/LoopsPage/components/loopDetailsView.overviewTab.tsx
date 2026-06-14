import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import type { LoopSourceStat, SourceHealth } from "src/features/loops";
import type { VacancyMatch } from "src/features/vacancyMatches";

import {
  buildHeatmap,
  buildLoopChips,
  generateLoopRecommendations,
  getSourceColor,
  groupMatchesBySource,
  selectTopScoredMatches,
  timeAgoFromIso,
} from "./loopDetailsView.helpers";
import { useTimeAgoLabel } from "./loopDetailsView.hooks";
import {
  FilterChip,
  NextRunCountdown,
  RecommendationCard,
} from "./loopDetailsView.parts";
import { LoopPreviewTab } from "./loopDetailsView.previewTab";
import { sortSourcesByPriority } from "./loopSettingsPanel.helpers";

export function LoopOverviewTab({
  loop,
  matches,
  matchesLoading,
  onOpenMatches,
  sourceStats,
  sourceStatsLoading,
  onRefreshSourceStats,
  onMatchSaved,
}: {
  loop: Loop;
  matches: VacancyMatch[];
  matchesLoading: boolean;
  onOpenMatches?: (id: string) => void;
  sourceStats: LoopSourceStat[];
  sourceStatsLoading: boolean;
  onRefreshSourceStats: () => void;
  onMatchSaved: () => void;
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

  const heatmap = useMemo(() => buildHeatmap(matches, 30), [matches]);
  const heatmapMax = Math.max(1, ...heatmap);
  const heatmapAvg = (heatmap.reduce((a, v) => a + v, 0) / heatmap.length).toFixed(1);

  const sourceBuckets = useMemo(() => groupMatchesBySource(matches), [matches]);
  // Render every source that is either configured for the loop OR has produced
  // a match — otherwise a match from a source not in `selectedSources`
  // (e.g. a remote board) would be invisible here while still counting toward
  // the total "МАТЧИ" tile, making the rail look inconsistent (3 vs 4).
  // Ordered by the product source priority (Arbeitsagentur first, LinkedIn
  // after the board/API sources) so the rail matches the Sources tab and the
  // Create Loop modal.
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
    return sortSourcesByPriority(result);
  }, [loop.selectedSources, sourceBuckets]);
  const lastSyncAgo = formatTimeAgo(timeAgoFromIso(loop.lastDiscoveryAt));

  const [dismissedRecs, setDismissedRecs] = useState<Set<string>>(new Set());
  const recommendations = useMemo(
    () => generateLoopRecommendations(loop, matches, sourceStats),
    [loop, matches, sourceStats],
  );
  const activeRecommendation = recommendations.find((r) => !dismissedRecs.has(r.id)) ?? null;

  // Model A: persisted VacancyMatch is the source of truth. Show the Top 5
  // persisted matches by backend-owned score (NULLS last, freshness tie-break);
  // preview is an explicit, clearly-labelled disclosure below.
  const topMatches = useMemo(() => selectTopScoredMatches(matches, 5), [matches]);
  const [previewOpen, setPreviewOpen] = useState(false);

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

        {/* Top fresh persisted matches (Model A: persisted VacancyMatch is the
            source of truth). The full, filterable list lives behind
            "Все матчи" → /matches; preview moved to the disclosure below. */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-3 px-1">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {t("loops.topFreshMatches", "Лучшие свежие матчи")}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {t("loops.topFreshMatchesSub", "Сохранённые совпадения этого цикла · по свежести")}
              </div>
            </div>
            {onOpenMatches && (
              <button
                type="button"
                onClick={() => onOpenMatches(loop.id)}
                className="shrink-0 text-[12px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("loops.allMatches", "Все матчи")} →
              </button>
            )}
          </div>

          {matchesLoading && matches.length === 0 ? (
            <TopMatchesSkeleton />
          ) : (
            <TopMatchesList matches={topMatches} />
          )}
        </div>

        {/* Preview kept intact (Model A) — moved behind an explicit disclosure
            and clearly marked as not auto-saved. */}
        <div className="rounded-[12px] border border-border bg-card p-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-[13px] font-medium text-foreground">
                {t("loops.previewTitle", "Предварительный поиск")}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {t(
                  "loops.previewDisclaimer",
                  "Предварительный поиск — не сохраняется автоматически",
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen((open) => !open)}
              aria-expanded={previewOpen}
              className="shrink-0 rounded-[8px] border border-border bg-muted px-3 py-1.5 text-[12px] text-foreground transition-colors hover:bg-muted/70"
            >
              {previewOpen
                ? t("loops.previewHide", "Скрыть")
                : t("loops.previewShow", "Проверить источники")}
            </button>
          </div>
          {previewOpen ? (
            <div className="mt-3">
              <LoopPreviewTab
                loop={loop}
                onRefreshSourceStats={onRefreshSourceStats}
                onMatchSaved={onMatchSaved}
              />
            </div>
          ) : null}
        </div>

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
                  <SourceHealthBadge health={health} />
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
                n: loop.discoveryIntervalHours ?? 4,
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

function SourceHealthBadge({ health }: { health: SourceHealth }) {
  const { t } = useTranslation();
  if (health === "error") {
    return (
      <span className="shrink-0 rounded-full bg-rose-100 px-1.5 py-0.5 text-[10px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
        {t("loops.sourceHealth_error", "ошибка")}
      </span>
    );
  }
  if (health === "warning") {
    return (
      <span className="shrink-0 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
        {t("loops.sourceHealth_warning", "медленно")}
      </span>
    );
  }
  return null;
}

function TopMatchesSkeleton() {
  return (
    <div className="overflow-hidden rounded-[12px] border border-border">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-3.5 border-b border-border px-4 py-3.5 last:border-b-0"
        >
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

function TopMatchesList({ matches }: { matches: VacancyMatch[] }) {
  const { t } = useTranslation();
  const formatTimeAgo = useTimeAgoLabel();

  if (matches.length === 0) {
    return (
      <div className="rounded-[12px] border border-dashed border-border bg-card px-6 py-8 text-center">
        <p className="text-[12.5px] text-muted-foreground">
          {t(
            "loops.topFreshMatchesEmpty",
            "Пока нет сохранённых совпадений. Запустите предварительный поиск ниже.",
          )}
        </p>
      </div>
    );
  }

  return (
    <ul className="overflow-hidden rounded-[12px] border border-border bg-card">
      {matches.map((match) => (
        <TopMatchRow
          key={match.id}
          match={match}
          timeAgoLabel={formatTimeAgo(
            timeAgoFromIso(match.postedAt ?? match.updatedAt ?? match.createdAt),
          )}
        />
      ))}
    </ul>
  );
}

function TopMatchRow({
  match,
  timeAgoLabel,
}: {
  match: VacancyMatch;
  timeAgoLabel: string;
}) {
  const { t } = useTranslation();
  const avatarLetter = (match.roleTitle || match.companyName || "?").charAt(0).toUpperCase();
  const meta = [match.companyName, match.locationText, match.source]
    .map((value) => value?.trim())
    .filter(Boolean)
    .join(" · ");

  return (
    <li className="flex items-center gap-3.5 border-b border-border px-4 py-3 last:border-b-0">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[7px] border border-border bg-muted text-[13px] font-semibold text-foreground select-none">
        {avatarLetter}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">
            {match.roleTitle || t("loops.dash", "—")}
          </span>
          {timeAgoLabel ? (
            <span className="shrink-0 text-[11px] text-muted-foreground/70">· {timeAgoLabel}</span>
          ) : null}
        </div>
        {meta ? (
          <div className="mt-0.5 truncate text-[11.5px] text-muted-foreground">{meta}</div>
        ) : null}
      </div>
      {/* Backend-owned match score. Null = not yet scored → neutral dash. */}
      {match.score === null ? (
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground/70"
          title={t("loops.matchScorePending", "Оценка ещё не рассчитана")}
        >
          —
        </span>
      ) : (
        <span
          className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium tabular-nums text-muted-foreground"
          title={t("loops.matchScoreHint", "Оценка соответствия фильтрам цикла")}
        >
          {match.score}
        </span>
      )}
      <a
        href={match.sourceUrl}
        target="_blank"
        rel="noreferrer"
        className="shrink-0 rounded-[6px] border border-border px-2.5 py-1.5 text-[11.5px] text-muted-foreground transition-colors hover:bg-muted"
      >
        {t("loops.openExternal", "Открыть ↗")}
      </a>
    </li>
  );
}
