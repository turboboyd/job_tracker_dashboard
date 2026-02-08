import { useTranslation } from "react-i18next";

import { LinkButton } from "src/shared/ui";

type Props = {
  backTo: string;
};

export function MatchDetailsHeaderActions({ backTo }: Props) {
  const { t } = useTranslation();

  return (
    <div className="flex items-center gap-sm">
      <LinkButton to={backTo} variant="outline" size="sm" shape="pill">
        {t("matches.details.backToFiltered")}
      </LinkButton>
    </div>
  );
}
