import { useTranslation } from "react-i18next";

import type { LoopStatus } from "src/entities/loop";
import type { DiscoveryRunHistoryItem } from "src/features/discoveryRuns";

import {
  getStatusBadgeClass,
  HISTORY_STATUS_STYLES,
  type LoopRecommendation,
} from "./loopDetailsView.helpers";

export function FilterChip({ label, value, hint }: { label: string; value: string; hint?: string }) {
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

export function LoopStatusBadge({ status }: { status: LoopStatus }) {
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

export function RecommendationCard({
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

export function NextRunCountdown({ nextRunAt }: { nextRunAt: string | null | undefined }) {
  const { t } = useTranslation();
  if (!nextRunAt) {
    return (
      <div className="mt-2 text-[18px] font-semibold tracking-[-0.025em] text-muted-foreground">
        {t("loops.nextSyncPending", "Ожидание запуска")}
      </div>
    );
  }
  // Intentional Date.now() in render: this coarse (minute/hour) countdown
  // reflects the current time on each render and does not live-tick. Freezing
  // "now" in state would make it stale across re-renders (e.g. when nextRunAt
  // updates after a sync on a long-open page); adding an interval would
  // introduce live-ticking the UI does not currently have. A benign concurrent
  // double-render computes the same displayed minute/hour value either way.
  // eslint-disable-next-line react-hooks/purity -- benign, coarse, non-ticking countdown
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

export function HistoryRow({ row }: { row: DiscoveryRunHistoryItem }) {
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
