import { useMemo } from "react";
import { useTranslation } from "react-i18next";

import type { LoopMatchStatus } from "src/entities/loopMatch";
import { Card, RadarChart, type RadarAxis, type RadarSeries } from "src/shared/ui";

type MatchLike = {
  status: LoopMatchStatus;
};

const PIPELINE_STATUSES: LoopMatchStatus[] = [
  "applied",
  "interview",
  "offer",
  "rejected",
];

const STATUS_COLOR: Record<LoopMatchStatus, string> = {
  new: "#111827",
  saved: "#6B7280",
  applied: "#3B82F6",
  interview: "#8B5CF6",
  offer: "#10B981",
  rejected: "#EF4444",
};

function normalizeStatus(value: LoopMatchStatus): LoopMatchStatus {
  return PIPELINE_STATUSES.includes(value) ? value : "applied";
}

export function DashboardStatusRadarCard({ matches }: { matches: MatchLike[] }) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  const counts = useMemo(() => {
    const base: Record<LoopMatchStatus, number> = {
      new: 0,
      saved: 0,
      applied: 0,
      interview: 0,
      offer: 0,
      rejected: 0,
    };
    for (const m of matches) {
      if (PIPELINE_STATUSES.includes(m.status)) base[m.status] += 1;
    }
    return base;
  }, [matches]);

  const total =
    counts.applied + counts.interview + counts.offer + counts.rejected;

  const axes = useMemo<RadarAxis<LoopMatchStatus>[]>(() => {
    return PIPELINE_STATUSES.map((st) => ({
      key: st,
      label: t(`status.${st}`, st),
    }));
  }, [t]);

  const series = useMemo<RadarSeries<LoopMatchStatus>[]>(() => {
    const values: Record<LoopMatchStatus, number> = {
      new: 0,
      saved: 0,
      applied: total ? counts.applied / total : 0,
      interview: total ? counts.interview / total : 0,
      offer: total ? counts.offer / total : 0,
      rejected: total ? counts.rejected / total : 0,
    };

    return [
      {
        key: "mix",
        label: t("radar.mix", "Mix"),
        color: "#2563EB",
        values,
      },
      {
        key: "rejected",
        label: t("status.rejected", "Rejected"),
        color: STATUS_COLOR.rejected,
        values: {
          ...values,
          rejected: total ? counts.rejected / total : 0,
          applied: 0,
          interview: 0,
          offer: 0,
          new: 0,
          saved: 0,
        } as Record<LoopMatchStatus, number>,
      },
    ];
  }, [counts.applied, counts.interview, counts.offer, counts.rejected, t, total]);

  return (
    <Card className="p-6">
      <div className="space-y-1">
        <div className="text-sm font-semibold text-foreground">
          {t("radar.title", "Pipeline mix")}
        </div>
        <div className="text-xs text-muted-foreground">
          {t("radar.subtitle", "Share by status")}
        </div>
      </div>

      <div className="mt-5 flex items-center justify-center">
        <RadarChart axes={axes} series={series} size={260} />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
        {PIPELINE_STATUSES.map((st) => (
          <div key={st} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: STATUS_COLOR[st] }}
              />
              <span className="text-muted-foreground">
                {t(`status.${st}`, st)}
              </span>
            </div>
            <span className="text-foreground">
              {total ? Math.round(((counts[normalizeStatus(st)] ?? 0) / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
