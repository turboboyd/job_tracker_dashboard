import React from "react";

import type { StatItem } from "./types";

export function QuickStatsGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="mt-10 grid grid-cols-3 divide-x divide-border border-t border-border pt-6">
      {stats.map((s) => (
        <div key={s.label} className="px-5 first:pl-0 last:pr-0">
          <div className="text-[10.5px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
            {s.label}
          </div>
          <div className="mt-1.5 text-[14.5px] font-semibold tracking-[-0.015em] text-foreground">
            {s.value}
          </div>
          <div className="mt-1 text-[12px] text-subtle-foreground">{s.hint}</div>
        </div>
      ))}
    </div>
  );
}
