import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { Loop } from "src/entities/loop";
import type { VacancyMatch } from "src/features/vacancyMatches";

import {
  computeConversionRate,
  countMatchesByStatus,
  groupMatchesBySource,
} from "./loopDetailsView.helpers";

export function LoopAnalyticsTab({
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
