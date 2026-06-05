import type { DiscoveryRunPreviewInsight } from "../rest/types";

import {
  DISCOVERY_PREVIEW_COPY,
  formatRelevanceScore,
  getRelevanceTone,
  type DiscoveryRelevanceTone,
} from "./discoveryPreview.helpers";

const TONE_BADGE_CLASSES: Record<DiscoveryRelevanceTone, string> = {
  high: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600",
  medium: "border-amber-500/40 bg-amber-500/10 text-amber-600",
  low: "border-border bg-muted/40 text-muted-foreground",
};

/**
 * Read-time "fit" breakdown for a discovery preview item: a colour-coded
 * relevance percentage plus which of the loop's terms were matched / missing.
 * Computed by the backend on the fly (no LLM/external call) so the user gets an
 * at-a-glance read before saving a vacancy. Renders nothing when there is no
 * meaningful signal to show.
 */
export function DiscoveryRelevanceInsight({
  insight,
}: {
  insight?: DiscoveryRunPreviewInsight | null;
}) {
  if (!insight) return null;

  const hasTerms = insight.matched.length > 0 || insight.missing.length > 0;
  if (!hasTerms && insight.score <= 0) return null;

  const pct = formatRelevanceScore(insight.score);
  const tone = getRelevanceTone(insight.score);

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span
        className={`rounded-full border px-2 py-0.5 text-[10.5px] font-medium ${TONE_BADGE_CLASSES[tone]}`}
      >
        {DISCOVERY_PREVIEW_COPY.relevanceLabel} {pct}%
      </span>

      {insight.matched.length > 0 ? (
        <span className="text-[10.5px] text-muted-foreground">
          {DISCOVERY_PREVIEW_COPY.relevanceMatchedLabel}
        </span>
      ) : null}
      {insight.matched.map((term) => (
        <span
          key={`matched-${term}`}
          className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] text-emerald-600"
        >
          {term}
        </span>
      ))}

      {insight.missing.length > 0 ? (
        <span className="text-[10.5px] text-muted-foreground">
          {DISCOVERY_PREVIEW_COPY.relevanceMissingLabel}
        </span>
      ) : null}
      {insight.missing.map((term) => (
        <span
          key={`missing-${term}`}
          className="rounded-full border border-border bg-muted/30 px-2 py-0.5 text-[10.5px] text-muted-foreground line-through decoration-muted-foreground/40"
        >
          {term}
        </span>
      ))}
    </div>
  );
}
