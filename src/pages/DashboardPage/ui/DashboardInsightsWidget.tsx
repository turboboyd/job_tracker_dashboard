import React from "react";

type MetricItem = {
  label: string;
  value: string;
  trend: number;
  trendLabel: string;
};

const METRICS: MetricItem[] = [
  { label: "Отклик → Интервью", value: "24%", trend: 5, trendLabel: "+5%" },
  { label: "Интервью → Оффер", value: "33%", trend: -2, trendLabel: "−2%" },
  { label: "Медиана до интервью", value: "6.4д", trend: -12, trendLabel: "−12%" },
  { label: "Требует внимания", value: "4", trend: 0, trendLabel: "" },
];

function trendColor(trend: number) {
  if (trend > 0) return "text-emerald-600";
  if (trend < 0) return "text-red-500";
  return "text-subtle-foreground";
}

export function DashboardInsightsWidget() {
  return (
    <div className="rounded-[14px] border border-border bg-card p-6">
      {/* Header */}
      <div>
        <div className="text-[14px] font-semibold tracking-[-0.015em] text-foreground">
          Инсайты
        </div>
        <div className="mt-0.5 text-[12px] text-subtle-foreground">
          Воронка конверсии
        </div>
      </div>

      {/* 2x2 grid of metrics */}
      <div className="mt-4 grid grid-cols-2 gap-2.5">
        {METRICS.map((m) => (
          <div
            key={m.label}
            className="rounded-xl border border-border bg-background px-3.5 py-3"
          >
            <div className="text-[11px] text-subtle-foreground leading-tight">{m.label}</div>
            <div className="mt-1.5 flex items-baseline gap-1.5">
              <span className="text-[18px] font-semibold tabular-nums tracking-[-0.02em] text-foreground">
                {m.value}
              </span>
              {m.trendLabel && (
                <span className={`text-[11px] font-medium ${trendColor(m.trend)}`}>
                  {m.trend > 0 ? "↑" : "↓"}{m.trendLabel.replace(/[+−-]/, "")}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Hint box */}
      <div className="mt-3.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5">
        <div className="text-[12px] text-foreground/80 leading-snug">
          <span className="font-medium text-primary">4 отклика</span> без ответа &gt; 14 дней
        </div>
      </div>
    </div>
  );
}
