import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import { joinTitles } from "src/entities/loop/lib/format";

import { getLoopStatusClassName, getLoopStatusLabel } from "./loopListView.helpers";
import { getLoopStatus, type LoopStats } from "./loopsPage.helpers";

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
  onOpen: (id: string) => void;
};

export function LoopCard({ loop, stats, onOpen }: LoopCardProps) {
  const { t } = useTranslation();
  const titlesText =
    joinTitles(Array.isArray(loop.titles) ? loop.titles : []) ||
    t("loops.dash", "—");
  let remoteText = t("loops.any", "Any");
  if (loop.remoteMode === "remote_only") {
    remoteText = t("loops.remoteOnly", "Remote");
  }
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

        {/* Col 3: metrics + open button */}
        <div className="flex flex-col items-end gap-2.5">
          <div className="text-right">
            <div className="text-[10.5px] text-muted-foreground">
              {t("loops.statMatches", "Matches")} · {t("loops.statApplications", "Applications")} · {t("loops.statToday", "Today")}
            </div>
            <div className="mt-1.5 flex items-baseline justify-end gap-3.5">
              <span className="text-[18px] font-semibold leading-none tabular-nums text-foreground">
                {stats.matches}
              </span>
              <span className="text-[18px] font-semibold leading-none tabular-nums text-primary">
                {stats.applications}
              </span>
              <span
                className={`text-[18px] font-semibold leading-none tabular-nums ${
                  stats.today > 0 ? "text-emerald-600" : "text-muted-foreground"
                }`}
              >
                +{stats.today}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpen(loop.id);
            }}
            className="rounded-[6px] border border-border bg-card px-3 py-1.5 text-[11.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            {t("loops.open", "Открыть")} →
          </button>
        </div>
      </div>
    </div>
  );
}
