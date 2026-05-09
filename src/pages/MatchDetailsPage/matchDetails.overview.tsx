import { Card } from "src/shared/ui/Card";

import { EMPTY_VALUE, StatusPill } from "./matchDetails.primitives";
import type { MatchOverviewCardProps } from "./matchDetails.types";

export function MatchOverviewCard({
  title,
  company,
  meta,
  status,
  openLinkLabel,
  url,
}: MatchOverviewCardProps) {
  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground break-words">
              {title || EMPTY_VALUE}
            </div>
            <div className="mt-1 text-sm text-muted-foreground break-words">
              {company || EMPTY_VALUE}
            </div>
            {meta ? (
              <div className="mt-2 text-xs text-muted-foreground break-words">
                {meta}
              </div>
            ) : null}
          </div>

          <StatusPill status={status} />
        </div>

        {url ? (
          <a
            href={url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {openLinkLabel}
          </a>
        ) : null}
      </div>
    </Card>
  );
}

