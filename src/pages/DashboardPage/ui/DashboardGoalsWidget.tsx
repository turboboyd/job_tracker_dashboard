import React from "react";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const BARS = [3, 2, 4, 1, 5, 2, 0];
const MAX_BAR = 5;
const APPLIED = 17;
const GOAL = 25;
const PCT = Math.round((APPLIED / GOAL) * 100); // 68
const STREAK = 12;

export function DashboardGoalsWidget() {
  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">
            Цели
          </div>
          <div className="mt-0.5 text-[12px] text-subtle-foreground">
            Еженедельный прогресс
          </div>
        </div>

        <div className="rounded-full border border-border px-3 py-1 text-[11px] font-medium text-subtle-foreground">
          7д
        </div>
      </div>

      {/* Goal summary */}
      <div className="mt-4 flex items-baseline gap-2">
        <span className="text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-foreground">
          {APPLIED}
        </span>
        <span className="text-[13px] text-subtle-foreground">
          / {GOAL} заявок
        </span>
        <span className="ml-auto text-[12px] font-medium text-emerald-600">
          🔥 {STREAK} дней
        </span>
      </div>

      {/* Mini bar chart */}
      <div className="mt-4 flex items-end gap-1.5 h-10">
        {BARS.map((v, i) => {
          const heightPct = v > 0 ? Math.max(20, (v / MAX_BAR) * 100) : 10;
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

      {/* Day labels */}
      <div className="mt-1 flex gap-1.5">
        {DAYS.map((d) => (
          <div key={d} className="flex-1 text-center text-[10px] text-subtle-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px] text-subtle-foreground mb-1.5">
          <span>Прогресс</span>
          <span className="tabular-nums font-medium text-foreground">{PCT}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${PCT}%` }}
          />
        </div>
      </div>
    </div>
  );
}
