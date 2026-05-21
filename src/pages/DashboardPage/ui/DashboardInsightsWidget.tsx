import { useMemo, useState } from "react";

import type { MatchLike } from "../model/dashboardAggregations";
import { toMillis } from "../model/dashboardAggregations";

const STALE_MS = 14 * 86400000;

interface Conversions {
  applied: number;
  replied: number;
  interviewed: number;
  offered: number;
}

function computeConversions(matches: readonly MatchLike[]): Conversions {
  let applied = 0;
  let replied = 0;
  let interviewed = 0;
  let offered = 0;

  for (const m of matches) {
    const s = String(m.status ?? "");
    if (s === "SAVED") continue;
    applied++;
    if (s.startsWith("INTERVIEW") || s === "TEST_TASK" || s === "OFFER" || s === "HIRED" || s === "REJECTED") replied++;
    if (s.startsWith("INTERVIEW") || s === "TEST_TASK" || s === "OFFER" || s === "HIRED") interviewed++;
    if (s === "OFFER" || s === "HIRED") offered++;
  }

  return { applied, replied, interviewed, offered };
}

function computeStale(matches: readonly MatchLike[], nowMs: number): number {
  let count = 0;
  for (const m of matches) {
    const s = String(m.status ?? "");
    if (s !== "ACTIVE" && s !== "APPLIED" && s !== "SAVED") continue;
    const ms = toMillis(m.updatedAt);
    if (ms > 0 && nowMs - ms > STALE_MS) count++;
  }
  return count;
}

function computeMedianDays(matches: readonly MatchLike[]): number | null {
  const durations: number[] = [];
  for (const m of matches) {
    const created = toMillis(m.createdAt);
    if (!created) continue;
    for (const h of m.statusHistory ?? []) {
      const s = String(h.status ?? "");
      if (!s.startsWith("INTERVIEW") && s !== "TEST_TASK") continue;
      const changed = toMillis((h as { changedAt?: unknown; date?: unknown }).changedAt ?? (h as { date?: unknown }).date);
      if (changed > created) {
        durations.push((changed - created) / 86400000);
        break;
      }
    }
  }
  if (durations.length === 0) return null;
  durations.sort((a, b) => a - b);
  const mid = Math.floor(durations.length / 2);
  return durations.length % 2 === 0
    ? (durations[mid - 1] + durations[mid]) / 2
    : durations[mid];
}

function staleNoun(n: number): string {
  if (n === 1) return "заявка";
  if (n >= 2 && n <= 4) return "заявки";
  return "заявок";
}

function pctStr(num: number, denom: number): string {
  if (denom === 0) return "—";
  return `${Math.round((num / denom) * 100)}%`;
}

export function DashboardInsightsWidget({ matches }: { matches: readonly MatchLike[] }) {
  const [nowMs] = useState(() => Date.now());

  const conversions = useMemo(() => computeConversions(matches), [matches]);
  const stale = useMemo(() => computeStale(matches, nowMs), [matches, nowMs]);
  const medianDays = useMemo(() => computeMedianDays(matches), [matches]);

  const { applied, replied, interviewed, offered } = conversions;

  const metrics = [
    {
      label: "Отклик → Интервью",
      value: pctStr(replied, applied),
    },
    {
      label: "Интервью → Оффер",
      value: pctStr(offered, interviewed),
    },
    {
      label: "Медиана до интервью",
      value: medianDays !== null ? `${medianDays.toFixed(1)}д` : "—",
    },
    {
      label: "Требует внимания",
      value: String(stale),
    },
  ];

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div>
        <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">Инсайты</div>
        <div className="mt-0.5 text-[12px] text-subtle-foreground">Воронка конверсии</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-xl border border-border bg-background px-3.5 py-3">
            <div className="text-[11px] text-subtle-foreground leading-tight">{m.label}</div>
            <div className="mt-1.5">
              <span className="text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-foreground">
                {m.value}
              </span>
            </div>
          </div>
        ))}
      </div>

      {stale > 0 ? (
        <div className="mt-3.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
          <div className="text-[12px] text-foreground/80 leading-snug">
            <span className="font-medium text-primary">{stale} {staleNoun(stale)}</span>
            {" "}без ответа более 14 дней
          </div>
        </div>
      ) : (
        <div className="mt-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:border-emerald-800/40 dark:bg-emerald-900/10 px-3.5 py-2.5">
          <div className="text-[12px] text-emerald-700 dark:text-emerald-400 leading-snug">
            Все активные заявки обновлялись недавно
          </div>
        </div>
      )}
    </div>
  );
}
