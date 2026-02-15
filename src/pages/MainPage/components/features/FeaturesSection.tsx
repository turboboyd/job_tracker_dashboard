import React from "react";

import { Card } from "src/shared/ui";

import type { FeatureItem } from "../hero/types";

export function FeaturesSection({ features }: { features: FeatureItem[] }) {
  return (
    <section className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
      {features.map((f) => (
        <Card
          key={f.title}
          className={[
            "h-full p-6",
            "border border-border bg-card",
            "transition-all duration-200",
            "motion-safe:hover:-translate-y-0.5",
            "motion-safe:hover:shadow-[var(--shadow-sm)]",
            "motion-safe:hover:bg-muted",
          ].join(" ")}
        >
          <div className="text-sm font-semibold text-foreground break-words [hyphens:auto]">
            {f.title}
          </div>

          <div className="mt-2 text-sm leading-6 text-muted-foreground break-words [hyphens:auto]">
            {f.text}
          </div>

          <ul className="mt-4 space-y-2">
            {f.points.map((p) => (
              <li key={p} className="flex items-start gap-2">
                <span className="mt-2 inline-block h-2 w-2 shrink-0 rounded-full bg-primary" />
                <span className="text-sm leading-6 text-foreground break-words [hyphens:auto]">
                  {p}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </section>
  );
}
