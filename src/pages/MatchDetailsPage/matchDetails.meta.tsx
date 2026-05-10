import { Card } from "src/shared/ui/Card";

import { EMPTY_VALUE, MetaRow } from "./matchDetails.primitives";
import type { MatchMetaCardProps } from "./matchDetails.types";

export function MatchMetaCard({
  title,
  loopLabel,
  locationLabel,
  platformLabel,
  matchedAtLabel,
  loopName,
  location,
  platform,
  matchedAt,
}: MatchMetaCardProps) {
  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="text-base font-semibold text-foreground">{title}</div>

      <dl className="mt-md grid grid-cols-1 gap-sm text-sm">
        <MetaRow label={loopLabel} value={loopName || EMPTY_VALUE} />
        <MetaRow label={locationLabel} value={location || EMPTY_VALUE} />
        <MetaRow label={platformLabel} value={platform || EMPTY_VALUE} />
        <MetaRow label={matchedAtLabel} value={matchedAt || EMPTY_VALUE} />
      </dl>
    </Card>
  );
}

