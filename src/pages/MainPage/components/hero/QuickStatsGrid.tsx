import React from "react";

import { Card } from "src/shared/ui";

import type { StatItem } from "./types";

export function QuickStatsGrid({ stats }: { stats: StatItem[] }) {
  return (
    <div className="mt-6 grid grid-cols-1 gap-md sm:grid-cols-3">
      {stats.map((s) => (
        <Card
          key={s.label}
          className={[
            "p-lg",
            "border border-border bg-card",
            "transition-all duration-normal ease-out",
            "motion-safe:hover:-translate-y-0.5",
            "motion-safe:hover:shadow-sm",
            "motion-safe:hover:bg-muted",
          ].join(" ")}
        >
          <div className="text-xs text-muted-foreground">{s.label}</div>

          <div className="mt-1 text-sm font-semibold text-foreground break-words [hyphens:auto]">
            {s.value}
          </div>

          <div className="mt-1 text-xs leading-5 text-muted-foreground break-words [hyphens:auto]">
            {s.hint}
          </div>
        </Card>
      ))}
    </div>
  );
}
