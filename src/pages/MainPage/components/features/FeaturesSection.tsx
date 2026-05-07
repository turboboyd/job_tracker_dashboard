import React from "react";

import type { FeatureItem } from "../hero/types";

export function FeaturesSection({ features }: { features: FeatureItem[] }) {
  return (
    <section className="mt-0 pb-14">
      <div className="mb-10">
        <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
          What&apos;s inside
        </div>
        <h2 className="mt-2.5 text-[32px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
          Tools for a steady search
        </h2>
      </div>

      {/* Grid with shared borders like the design */}
      <div className="grid grid-cols-1 overflow-hidden rounded-2xl border border-border md:grid-cols-3">
        {features.map((f, i) => (
          <div
            key={f.title}
            className={[
              "bg-card p-8",
              i > 0 ? "border-t border-border md:border-l md:border-t-0" : "",
            ].join(" ")}
          >
            <div className="mb-5 grid h-9 w-9 place-items-center rounded-lg border border-border bg-muted text-foreground">
              <span className="inline-block h-[14px] w-[14px] rounded-full bg-primary/60" />
            </div>
            <h3 className="text-[17px] font-semibold leading-tight tracking-[-0.02em]">
              {f.title}
            </h3>
            <p className="mt-2.5 text-[13.5px] leading-[1.55] text-muted-foreground">
              {f.text}
            </p>
            <ul className="mt-5 flex flex-col gap-2">
              {f.points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-[13px]">
                  <span className="mt-0.5 shrink-0 text-primary">✓</span>
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
