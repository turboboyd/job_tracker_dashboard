import { useTranslation } from "react-i18next";

import { StatusPill } from "src/entities/application";
import type { LoopMatch } from "src/entities/loopMatch";
import { buildMatchMeta, formatMatchedAt, formatPlatformLabel } from "src/entities/loopMatch";
import { Card } from "src/shared/ui";

interface Props {
  match: LoopMatch;
  loopName: string;
}

export function MatchDetailsSummaryCard({ match, loopName }: Props) {
  const { t } = useTranslation();

  const matchedAt = match.matchedAt ? formatMatchedAt(match.matchedAt) : "";
  const platform = formatPlatformLabel(match.platform);

  const meta = buildMatchMeta([match.location, platform, matchedAt, loopName]);

  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="flex flex-col gap-md">
        <div className="flex items-start justify-between gap-md">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-foreground break-words">
              {match.title || "—"}
            </div>
            <div className="mt-1 text-sm text-muted-foreground break-words">
              {match.company || "—"}
            </div>
            {meta ? (
              <div className="mt-2 text-xs text-muted-foreground break-words">
                {meta}
              </div>
            ) : null}
          </div>

          <StatusPill status={match.status} />
        </div>

        {match.url ? (
          <a
            href={match.url}
            target="_blank"
            rel="noreferrer"
            className="text-sm text-primary hover:underline break-all"
          >
            {t("matches.details.openLink")}
          </a>
        ) : null}
      </div>
    </Card>
  );
}
