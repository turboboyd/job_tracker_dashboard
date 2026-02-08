import { useTranslation } from "react-i18next";

import type { LoopMatch } from "src/entities/loopMatch";
import { Card } from "src/shared/ui";

type Props = {
  match: LoopMatch;
};

export function MatchDetailsDescriptionCard({ match }: Props) {
  const { t } = useTranslation();

  return (
    <Card variant="default" padding="md" shadow="sm" className="w-full">
      <div className="text-base font-semibold text-foreground">
        {t("matches.details.descriptionTitle")}
      </div>
      <div className="mt-sm text-sm leading-relaxed whitespace-pre-wrap">
        {match.description || t("matches.details.noDescription")}
      </div>
    </Card>
  );
}
