
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  BOARD_COLUMN_KEYS,
  type BoardColumnKey,
  type StatusKey,
  getBoardColumn,
} from "src/entities/application/model/status";
import { Card } from "src/shared/ui";

import { diffDays, medianDays, parseMs } from "../model/dashboardTimeSeries";

type HistoryItem = {
  status: StatusKey;
  changedAt?: unknown;
  date?: unknown;
};

type MatchLike = {
  status: StatusKey;
  createdAt: unknown;
  updatedAt: unknown;
  statusHistory?: HistoryItem[];
};

const PIPELINE_COLS: BoardColumnKey[] = BOARD_COLUMN_KEYS.filter(
  (c) => c !== "ARCHIVED",
);

function pct(num: number, den: number): number {
  if (den <= 0) return 0;
  return Math.round((num / den) * 100);
}

function getHistoryDate(h: HistoryItem): number | null {
  return parseMs(h.changedAt ?? h.date ?? null);
}

export function DashboardInsightsCard({
  matches,
}: {
  matches: MatchLike[];
}) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const [nowMs] = useState(() => Date.now());

  const {
    activeToInterview,
    interviewToOffer,
    offerToHired,
    medDaysToInterview,
    medDaysToOffer,
    staleCounts,
  // eslint-disable-next-line sonarjs/cognitive-complexity
  } = useMemo(() => {
    let activeEntered = 0;
    let interviewEntered = 0;
    let offerEntered = 0;

    let activeToInterviewCount = 0;
    let interviewToOfferCount = 0;
    let offerToHiredCount = 0;

    const interviewDurations: number[] = [];
    const offerDurations: number[] = [];

    const stale: Record<BoardColumnKey, number> = Object.fromEntries(
      BOARD_COLUMN_KEYS.map((k) => [k, 0]),
    ) as Record<BoardColumnKey, number>;

    for (const m of matches) {
      const history = m.statusHistory ?? [];
      if (!history.length) continue;

      const sorted = [...history].sort(
        (a, b) => (getHistoryDate(a) ?? 0) - (getHistoryDate(b) ?? 0),
      );

      const cols = sorted.map((h) => getBoardColumn(h.status));

      const firstActiveIndex = cols.indexOf("ACTIVE");
      const firstInterviewIndex = cols.indexOf("INTERVIEW");
      const firstOfferIndex = cols.indexOf("OFFER");
      const firstHiredIndex = cols.indexOf("HIRED");

      if (firstActiveIndex !== -1) activeEntered++;
      if (firstInterviewIndex !== -1) interviewEntered++;
      if (firstOfferIndex !== -1) offerEntered++;

      if (
        firstActiveIndex !== -1 &&
        firstInterviewIndex !== -1 &&
        firstInterviewIndex > firstActiveIndex
      ) {
        activeToInterviewCount++;

        const a = getHistoryDate(sorted[firstActiveIndex]);
        const b = getHistoryDate(sorted[firstInterviewIndex]);
        if (a && b) interviewDurations.push(diffDays(a, b));
      }

      if (
        firstInterviewIndex !== -1 &&
        firstOfferIndex !== -1 &&
        firstOfferIndex > firstInterviewIndex
      ) {
        interviewToOfferCount++;

        const a = getHistoryDate(sorted[firstInterviewIndex]);
        const b = getHistoryDate(sorted[firstOfferIndex]);
        if (a && b) offerDurations.push(diffDays(a, b));
      }

      if (
        firstOfferIndex !== -1 &&
        firstHiredIndex !== -1 &&
        firstHiredIndex > firstOfferIndex
      ) {
        offerToHiredCount++;
      }

      const last = sorted[sorted.length - 1];
      const lastCol = getBoardColumn(last.status);
      const lastDate = getHistoryDate(last);

      if (lastDate) {
        const days = diffDays(lastDate, nowMs);
        if (days >= 14 && PIPELINE_COLS.includes(lastCol)) {
          stale[lastCol] += 1;
        }
      }
    }

    return {
      activeToInterview: pct(activeToInterviewCount, activeEntered),
      interviewToOffer: pct(interviewToOfferCount, interviewEntered),
      offerToHired: pct(offerToHiredCount, offerEntered),
      medDaysToInterview: medianDays(interviewDurations),
      medDaysToOffer: medianDays(offerDurations),
      staleCounts: stale,
    };
  }, [matches, nowMs]);

  const needsAttention =
    staleCounts.ACTIVE + staleCounts.INTERVIEW + staleCounts.OFFER;

  return (
    <Card className="p-6">
      <div className="text-sm font-semibold text-foreground">
        {t("insights.title", "Insights")}
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Kpi label="Active → Interview" value={`${activeToInterview}%`} />
        <Kpi label="Interview → Offer" value={`${interviewToOffer}%`} />
        <Kpi label="Offer → Hired" value={`${offerToHired}%`} />
        <Kpi
          label="Median to Interview"
          value={medDaysToInterview == null ? "—" : `${medDaysToInterview}d`}
        />
        <Kpi
          label="Median to Offer"
          value={medDaysToOffer == null ? "—" : `${medDaysToOffer}d`}
        />
        <Kpi label="Needs attention" value={`${needsAttention}`} />
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
