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

export function FooterNote({ title, text, pills, ctaPrimary, ctaSecondary }: Props) {
  return (
    <section className="mt-10 mb-16">
      {/* CTA card with gradient radial accents */}
      <div
        className="relative overflow-hidden rounded-2xl border border-border bg-card p-12"
        style={{}}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "radial-gradient(circle at 90% 50%, color-mix(in srgb, rgb(230 94 76) 12%, transparent), transparent 50%), radial-gradient(circle at 10% 100%, color-mix(in srgb, rgb(59 130 246) 10%, transparent), transparent 50%)",
          }}
        />
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="max-w-[520px]">
            <div className="text-[11px] font-medium uppercase tracking-[0.07em] text-subtle-foreground">
              {title}
            </div>
            <h2 className="mt-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.03em] text-foreground">
              Less noise, more control
            </h2>
            <p className="mt-3 text-[14px] leading-[1.6] text-muted-foreground">{text}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {pills.map((p) => (
                <StatusPill key={p.label} label={p.label} tone={p.tone} className="border border-border" />
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-2.5 sm:min-w-[200px]">
            <div className="w-full">{ctaPrimary}</div>
            <div className="w-full">{ctaSecondary}</div>
            <p className="text-center text-[11.5px] text-subtle-foreground">
              Free. No card. No ads.
            </p>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      <div className="mt-10 flex items-center justify-between border-t border-border pt-6 text-[11.5px] text-subtle-foreground">
        <div className="flex items-center gap-2">
          <div className="grid h-[18px] w-[18px] place-items-center rounded-[4px] bg-foreground text-[10px] font-bold text-background">
            L
          </div>
          <span>Loopboard · 2026</span>
        </div>
        <div className="flex gap-4">
          <a className="hover:text-foreground transition-colors cursor-pointer">Privacy</a>
          <a className="hover:text-foreground transition-colors cursor-pointer">Terms</a>
          <a className="hover:text-foreground transition-colors cursor-pointer">GitHub</a>
        </div>
      </div>
    </section>
  );
}
