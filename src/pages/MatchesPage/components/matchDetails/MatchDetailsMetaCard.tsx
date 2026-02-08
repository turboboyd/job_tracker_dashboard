import React from "react";
import { useTranslation } from "react-i18next";

import type { LoopMatch } from "src/entities/loopMatch";
import { formatMatchedAt, normalizePlatform } from "src/entities/loopMatch";
import { Card } from "src/shared/ui";

import { MetaRow } from "./MetaRow";

type Props = {
  match: LoopMatch;
  loopName: string;
};

export function MatchDetailsMetaCard({ match, loopName }: Props) {
  const { t } = useTranslation();

  const matchedAt = React.useMemo(() => {
    return match.matchedAt ? formatMatchedAt(match.matchedAt) : "";
  }, [match.matchedAt]);

  const platform = React.useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);

  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="text-base font-semibold text-foreground">
        {t("matches.details.metaTitle")}
      </div>

      <dl className="mt-md grid grid-cols-1 gap-sm text-sm">
        <MetaRow label={t("matches.details.fields.loop")} value={loopName || "—"} />
        <MetaRow
          label={t("matches.details.fields.location")}
          value={match.location || "—"}
        />
        <MetaRow
          label={t("matches.details.fields.platform")}
          value={platform || "—"}
        />
        <MetaRow
          label={t("matches.details.fields.matchedAt")}
          value={matchedAt || "—"}
        />
      </dl>
    </Card>
  );
}
