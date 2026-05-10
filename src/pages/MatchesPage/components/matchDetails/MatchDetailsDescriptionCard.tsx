import { useTranslation } from "react-i18next";

import type { LoopMatch } from "src/entities/loopMatch";

import { MatchDetailsPanel } from "./MatchDetailsPanel";

interface Props {
  match: LoopMatch;
}

export function MatchDetailsDescriptionCard({ match }: Props) {
  const { t } = useTranslation();

  return (
    <MatchDetailsPanel title={t("matches.details.descriptionTitle")}>
      <div className="mt-sm text-sm leading-relaxed whitespace-pre-wrap">
        {match.description || t("matches.details.noDescription")}
      </div>
    </MatchDetailsPanel>
  );
}
