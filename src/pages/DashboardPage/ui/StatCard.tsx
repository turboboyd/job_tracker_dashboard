import React from "react";

import { classNames } from "src/shared/lib/classNames";

interface StatCardProps {
  label: string;
  value: number;
  color?: string;
}

export const StatCard: React.FC<StatCardProps> = ({ label, value, color }) => {
  return (
    <div className="rounded-xl border border-border bg-card p-5 shadow-sm flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground truncate">
          {label}
        </div>
        <div className={classNames("mt-2 text-3xl font-semibold leading-none", color ?? "text-foreground")}>
          {value}
        </div>
      </div>
    </div>
  );
};
