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
    <section className="overflow-hidden rounded-3xl border border-border bg-card p-6 sm:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-sm rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-primary" />
            <span className="break-words [hyphens:auto]">{badgeText}</span>
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {title}
            <span className="text-muted-foreground"> {titleMuted}</span>
          </h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground sm:text-base">
            {subtitle}
          </p>

          <div className="mt-6 flex flex-col gap-md sm:flex-row sm:flex-wrap sm:items-center">
            <div className="w-full sm:w-auto">{ctaPrimary}</div>
            <div className="w-full sm:w-auto">{ctaSecondary}</div>
            <div className="w-full sm:w-auto">{ctaTertiary}</div>
          </div>

          <QuickStatsGrid stats={quickStats} />
        </div>

        <PreviewCard model={preview} />
      </div>
    </section>
  );
}
