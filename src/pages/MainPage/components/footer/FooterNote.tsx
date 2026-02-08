import React from "react";

import type { CtaBlock } from "../hero/types";
import type { StatusTone } from "../StatusPill";
import { StatusPill } from "../StatusPill";

type Props = {
  title: string;
  text: string;
  pills: { label: string; tone: StatusTone }[];
  ctaPrimary: CtaBlock;
  ctaSecondary: CtaBlock;
};

export function FooterNote({
  title,
  text,
  pills,
  ctaPrimary,
  ctaSecondary,
}: Props) {
  return (
    <section className="mt-10 overflow-hidden rounded-2xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-col gap-lg sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <div className="text-sm font-semibold text-foreground">{title}</div>

          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            {text}
          </div>

          <div className="mt-3 flex flex-wrap gap-sm">
            {pills.map((p) => (
              <StatusPill
                key={p.label}
                label={p.label}
                tone={p.tone}
                className="border border-border"
              />
            ))}
          </div>
        </div>

        <div className="flex w-full flex-col gap-md sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="w-full sm:w-auto">{ctaPrimary}</div>
          <div className="w-full sm:w-auto">{ctaSecondary}</div>
        </div>
      </div>
    </section>
  );
}
