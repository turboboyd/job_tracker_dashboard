import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { StatusKey } from "src/entities/application/model/status";
import { Card } from "src/shared/ui";

import { buildDailyBuckets, type MatchTimestampsLike } from "../model/dashboardTimeSeries";

type RangeKey = "7d" | "30d";

const LS_KEY = "dashboard:goals:weeklyApplied:v1";
const PIPELINE_STATUS: StatusKey = "APPLIED";

function clampInt(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, Math.trunc(v)));
}

function readGoalFromLS(): number {
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return 10;
    const n = Number(raw);
    if (Number.isFinite(n) && n > 0) return clampInt(n, 1, 100);
    return 10;
  } catch {
    return 10;
  }
}

export function DashboardGoalsCard({ matches }: { matches: MatchTimestampsLike[] }) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });

  // ✅ init без эффекта
  const [goal, setGoal] = useState<number>(() => readGoalFromLS());
  const [range, setRange] = useState<RangeKey>("7d");

  // ✅ эффект только для синхронизации наружу (localStorage)
  useEffect(() => {
    try {
      window.localStorage.setItem(LS_KEY, String(goal));
    } catch {
      // ignore
    }
  }, [goal]);

  const buckets = useMemo(() => {
    const days = range === "7d" ? 7 : 30;
    return buildDailyBuckets(matches, { days, byUpdatedAt: false, locale: i18n.language });
  }, [matches, range, i18n.language]);

  const applied = useMemo(() => {
    return buckets.reduce((acc, b) => acc + (b.counts[PIPELINE_STATUS] ?? 0), 0);
  }, [buckets]);

  const pct = useMemo(() => {
    if (goal <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((applied / goal) * 100)));
  }, [applied, goal]);

  const streak = useMemo(() => {
    const values = buckets.map((b) => b.counts[PIPELINE_STATUS] ?? 0);
    let s = 0;
    for (let i = values.length - 1; i >= 0; i -= 1) {
      if (values[i] > 0) s += 1;
      else break;
    }
    return s;
  }, [buckets]);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {t("goals.title", "Goals")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("goals.subtitle", "Stay consistent and track your progress")}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(["7d", "30d"] as const).map((k) => (
            <button
              key={k}
              type="button"
              className={[
                "rounded-full border px-3 py-1 text-xs transition",
                range === k ? "border-foreground/30 bg-muted" : "border-border hover:bg-muted/60",
              ].join(" ")}
              onClick={() => setRange(k)}
            >
              {t(`range.${k}`, k)}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-border bg-background px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs text-muted-foreground">
            {t("goals.weeklyApplied", "Applied goal")}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-border bg-background text-sm text-foreground hover:bg-muted"
              onClick={() => setGoal((g) => clampInt(g - 1, 1, 100))}
              aria-label={t("goals.decrease", "Decrease")}
            >
              −
            </button>
            <div className="min-w-[64px] text-center text-sm font-semibold text-foreground">
              {goal}
            </div>
            <button
              type="button"
              className="h-8 w-8 rounded-full border border-border bg-background text-sm text-foreground hover:bg-muted"
              onClick={() => setGoal((g) => clampInt(g + 1, 1, 100))}
              aria-label={t("goals.increase", "Increase")}
            >
              +
            </button>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {t("goals.progress", "Progress")}:{" "}
              <span className="text-foreground font-medium">
                {applied}/{goal}
              </span>
            </span>
            <span className="text-foreground font-medium">{pct}%</span>
          </div>

          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-foreground/70" style={{ width: `${pct}%` }} />
          </div>

          <div className="mt-3 text-xs text-muted-foreground">
            {t("goals.streak", "Streak")}:{" "}
            <span className="text-foreground font-medium">
              {streak} {t("goals.days", "days")}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}
