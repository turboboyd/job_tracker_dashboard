import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import type { LoopMatchStatus } from "src/entities/loopMatch";
import { Button, Card } from "src/shared/ui";

import { diffDays, medianDays, parseMs } from "../model/dashboardTimeSeries";

type MatchLike = {
  status: LoopMatchStatus;
  createdAt: unknown;
  updatedAt: unknown;
};

const PIPELINE: LoopMatchStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 100);
}

export function DashboardInsightsCard({ matches }: { matches: MatchLike[] }) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();

  const [nowMs] = useState(() => Date.now());

  const counts = useMemo(() => {
    const m: Record<LoopMatchStatus, number> = {
      new: 0,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const x of matches) m[x.status] += 1;
    return m;
  }, [matches]);

  const medDaysToInterview = useMemo(() => {
    const values: number[] = [];
    for (const m of matches) {
      if (m.status !== "interview") continue;
      const a = parseMs(m.createdAt);
      const b = parseMs(m.updatedAt);
      if (!a || !b) continue;
      values.push(diffDays(a, b));
    }
    return medianDays(values);
  }, [matches]);

  const medDaysToOffer = useMemo(() => {
    const values: number[] = [];
    for (const m of matches) {
      if (m.status !== "offer") continue;
      const a = parseMs(m.createdAt);
      const b = parseMs(m.updatedAt);
      if (!a || !b) continue;
      values.push(diffDays(a, b));
    }
    return medianDays(values);
  }, [matches]);

  const stale = useMemo(() => {
    // “Needs attention”: pipeline items not updated for 14+ days
    const thresholdDays = 14;
    const out: Record<LoopMatchStatus, number> = {
      new: 0,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };

    for (const m of matches) {
      if (!PIPELINE.includes(m.status)) continue;
      const upd = parseMs(m.updatedAt) || parseMs(m.createdAt);
      if (!upd) continue;
      const days = diffDays(upd, nowMs);
      if (days >= thresholdDays) out[m.status] += 1;
    }
    return out;
  }, [matches, nowMs]);

  const appliedToInterview = pct(counts.interview + counts.offer + counts.rejected, counts.applied + counts.interview + counts.offer + counts.rejected);
  const interviewToOffer = pct(counts.offer, counts.interview + counts.offer);

  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">
        {t("insights.title", "Insights")}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi
          label={t("insights.kpi.appliedToInterview", "Applied → Interview")}
          value={`${appliedToInterview}%`}
        />
        <Kpi
          label={t("insights.kpi.interviewToOffer", "Interview → Offer")}
          value={`${interviewToOffer}%`}
        />
        <Kpi
          label={t("insights.kpi.medianToInterview", "Median to Interview")}
          value={medDaysToInterview == null ? "—" : `${medDaysToInterview}d`}
        />
        <Kpi
          label={t("insights.kpi.medianToOffer", "Median to Offer")}
          value={medDaysToOffer == null ? "—" : `${medDaysToOffer}d`}
        />
        <Kpi
          label={t("insights.kpi.stale", "Needs attention")}
          value={`${stale.applied + stale.interview + stale.offer + stale.rejected}`}
        />
      </div>

      <div className="mt-5 rounded-xl border border-border bg-muted/30 p-4">
        <div className="text-sm font-medium text-foreground">
          {t("insights.actions.title", "Next actions")}
        </div>
        <div className="mt-2 space-y-2">
          <ActionRow
            label={t("insights.actions.staleApplied", "Applied without updates (14+ days)")}
            count={stale.applied}
            onGo={() => navigate(`${RoutePath[AppRoutes.MATCHES]}?status=applied`)}
            cta={t("insights.actions.view", "View")}
          />
          <ActionRow
            label={t("insights.actions.staleInterview", "Interview without updates (14+ days)")}
            count={stale.interview}
            onGo={() => navigate(`${RoutePath[AppRoutes.MATCHES]}?status=interview`)}
            cta={t("insights.actions.view", "View")}
          />
          <ActionRow
            label={t("insights.actions.staleOffer", "Offers to follow up (14+ days)")}
            count={stale.offer}
            onGo={() => navigate(`${RoutePath[AppRoutes.MATCHES]}?status=offer`)}
            cta={t("insights.actions.view", "View")}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="outline"
          shape="pill"
          onClick={() => navigate(RoutePath[AppRoutes.MATCHES])}
        >
          {t("insights.actions.openAll", "Open all")}
        </Button>
        <Button
          size="sm"
          variant="default"
          shape="pill"
          onClick={() => navigate(RoutePath[AppRoutes.SETTINGS_PROFILE])}
        >
          {t("pipeline.profileCta.button")}
        </Button>
      </div>
    </Card>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-background px-4 py-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}

function ActionRow({
  label,
  count,
  cta,
  onGo,
}: {
  label: string;
  count: number;
  cta: string;
  onGo: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="truncate text-sm text-foreground">{label}</div>
      </div>
      <div className="flex items-center gap-2">
        <div className="min-w-[24px] text-right text-sm text-muted-foreground">
          {count}
        </div>
        <button
          type="button"
          onClick={onGo}
          className="rounded-full border border-border bg-background px-3 py-1 text-xs text-foreground hover:bg-muted"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
