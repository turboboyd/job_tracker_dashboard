import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import {
  type LoopSourceStat,
  type SourceHealth,
  updateLoopViaRest,
} from "src/features/loops";
import type { VacancyMatch } from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";

import {
  getSourceColor,
  groupMatchesBySource,
  timeAgoFromIso,
} from "./loopDetailsView.helpers";
import { useTimeAgoLabel } from "./loopDetailsView.hooks";
import {
  DISCOVERY_SOURCE_OPTIONS,
  mergeKnownAndSelectedOptions,
} from "./loopSettingsPanel.helpers";

export function LoopSourcesTab({
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
  const sources = useMemo(() => loop.selectedSources ?? [], [loop.selectedSources]);
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

  const getLastRunLabel = (stat: LoopSourceStat | undefined) => {
    if (sourceStatsLoading) {
      return "…";
    }

    if (stat?.lastRunAt) {
      return formatTimeAgo(timeAgoFromIso(stat.lastRunAt));
    }

    return t("loops.sourceNeverRun", "Never run");
  };

  const renderSourceHealthBadge = (enabled: boolean, health: SourceHealth) => {
    if (!enabled) {
      return (
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
          {t("loops.sourceDisabled", "Выключен")}
        </span>
      );
    }

    if (health === "ok") {
      return (
        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
          {t("loops.sourceStatusOnline", "● Онлайн")}
        </span>
      );
    }

    if (health === "warning") {
      return (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10.5px] font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
          {t("loops.sourceStatusSlow", "Медленно")}
        </span>
      );
    }

    if (health === "error") {
      return (
        <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10.5px] font-medium text-rose-700 dark:bg-rose-900/30 dark:text-rose-300">
          {t("loops.sourceStatusError", "Ошибка")}
        </span>
      );
    }

    return (
      <span className="rounded-full bg-muted px-2 py-0.5 text-[10.5px] font-medium text-muted-foreground">
        {t("loops.sourceStatusNever", "Не запускался")}
      </span>
    );
  };

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
            const lastRunLabel = getLastRunLabel(stat);
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
                    {renderSourceHealthBadge(enabled, health)}
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
