import { useMemo, useState } from "react";

import type { MatchLike } from "../model/dashboardAggregations";
import { toMillis } from "../model/dashboardAggregations";

const WEEKLY_GOAL = 20;
const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function getMonStart(nowMs: number): number {
  const d = new Date(nowMs);
  const dow = d.getDay();
  const diffToMon = dow === 0 ? -6 : 1 - dow;
  const mon = new Date(d);
  mon.setDate(d.getDate() + diffToMon);
  mon.setHours(0, 0, 0, 0);
  return mon.getTime();
}

function computeWeekBars(matches: readonly MatchLike[], weekStart: number): number[] {
  const bars = Array(7).fill(0) as number[];
  const weekEnd = weekStart + 7 * 86400000;
  for (const m of matches) {
    const ms = toMillis(m.createdAt);
    if (ms >= weekStart && ms < weekEnd) {
      const idx = Math.floor((ms - weekStart) / 86400000);
      if (idx >= 0 && idx < 7) bars[idx]++;
    }
  }
  return bars;
}

function computeStreak(matches: readonly MatchLike[], nowMs: number): number {
  const daySet = new Set<number>();
  for (const m of matches) {
    const ms = toMillis(m.createdAt);
    if (ms > 0) daySet.add(Math.floor(ms / 86400000));
  }
  const todayKey = Math.floor(nowMs / 86400000);
  let streak = 0;
  let day = todayKey;
  while (daySet.has(day)) { streak++; day--; }
  return streak;
}

function streakLabel(n: number): string {
  if (n === 1) return "день";
  if (n >= 2 && n <= 4) return "дня";
  return "дней";
}

export function DashboardGoalsWidget({ matches }: { matches: readonly MatchLike[] }) {
  const [nowMs] = useState(() => Date.now());

  const weekStart = useMemo(() => getMonStart(nowMs), [nowMs]);
  const bars = useMemo(() => computeWeekBars(matches, weekStart), [matches, weekStart]);
  const weekTotal = useMemo(() => bars.reduce((s, v) => s + v, 0), [bars]);
  const streak = useMemo(() => computeStreak(matches, nowMs), [matches, nowMs]);

  const maxBar = Math.max(...bars, 1);
  const pct = Math.min(100, Math.round((weekTotal / WEEKLY_GOAL) * 100));

  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">Цели</div>
          <div className="mt-0.5 text-[12px] text-subtle-foreground">Еженедельный прогресс</div>
        </div>
        <div className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-subtle-foreground">7д</div>
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
          {weekTotal}
        </span>
        <span className="text-[13px] text-subtle-foreground">/ {WEEKLY_GOAL} заявок</span>
        {streak > 0 ? (
          <span className="ml-auto text-[12px] font-medium text-emerald-600">
            🔥 {streak} {streakLabel(streak)}
          </span>
        ) : null}
      </div>

      <div className="mt-4 flex items-end gap-1.5 h-10">
        {bars.map((v, i) => {
          const heightPct = v > 0 ? Math.max(20, (v / maxBar) * 100) : 10;
          return (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className={`w-full rounded-sm transition-all ${v > 0 ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${heightPct}%` }}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-1 flex gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] text-subtle-foreground">{d}</div>
        ))}
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-subtle-foreground mb-1.5">
          <span>Прогресс</span>
          <span className="tabular-nums font-medium text-foreground">{pct}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
