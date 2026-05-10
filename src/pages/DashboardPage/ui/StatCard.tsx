import React from "react";

type StatCardProps = {
  label: string;
  value: number | string;
  sub?: string;
  trend?: number;
  accent?: boolean;
};

function trendColor(trend: number) {
  if (trend > 0) return "text-emerald-600";
  if (trend < 0) return "text-red-500";
  return "text-subtle-foreground";
}

function trendArrow(trend: number) {
  if (trend > 0) return "↑";
  if (trend < 0) return "↓";
  return "→";
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, sub, trend, accent }) => {
  return (
    <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="truncate text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
          {label}
        </div>
        {trend !== undefined && (
          <span className={`shrink-0 whitespace-nowrap text-[11px] font-medium ${trendColor(trend)}`}>
            {trendArrow(trend)} {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div
        className={`mt-2.5 text-[30px] font-semibold leading-none tracking-[-0.03em] tabular-nums ${accent ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </div>
      {sub && <div className="mt-1.5 text-[11.5px] text-subtle-foreground">{sub}</div>}
    </div>
  );
};
