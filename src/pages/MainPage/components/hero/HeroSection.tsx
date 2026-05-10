import { PreviewCard } from "./PreviewCard";
import { QuickStatsGrid } from "./QuickStatsGrid";
import type { CtaBlock, PreviewModel, StatItem } from "./types";

type Props = {
  badgeText: string;
  title: string;
  titleMuted: string;
  subtitle: string;

  ctaPrimary: CtaBlock;
  ctaSecondary: CtaBlock;
  ctaTertiary: CtaBlock;

  quickStats: StatItem[];
  preview: PreviewModel;
};

export function HeroSection({
  badgeText,
  title,
  titleMuted,
  subtitle,
  ctaPrimary,
  ctaSecondary,
  ctaTertiary,
  quickStats,
  preview,
}: Props) {
  return (
    <section className="py-16 sm:py-24">
      <div className="flex flex-col gap-12 lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
        {/* Left: text */}
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-[11.5px] font-medium text-muted-foreground">
            <span className="h-[6px] w-[6px] shrink-0 rounded-full bg-primary" />
            {badgeText}
          </div>

          <h1
            className="mt-5 font-semibold leading-[1.02] tracking-[-0.035em] text-foreground"
            style={{ fontSize: "clamp(36px, 5.5vw, 60px)" }}
          >
            {title}
            <br />
            <span className="text-muted-foreground">{titleMuted}</span>
          </h1>

          <p className="mt-6 max-w-[540px] text-[16px] leading-[1.55] tracking-[-0.01em] text-muted-foreground">
            {subtitle}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            {ctaPrimary}
            {ctaSecondary}
            {ctaTertiary}
          </div>

          <QuickStatsGrid stats={quickStats} />
        </div>

        {/* Right: preview card */}
        <div className="relative">
          {/* Subtle grid bg */}
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-10 -z-10"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgb(var(--border)) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--border)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
              maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.5) 0%, transparent 70%)",
            }}
          />
          <PreviewCard model={preview} />
        </div>
      </div>
    </section>
  );
}
