import { useTranslation } from "react-i18next";

import type { ViewMode } from "../model/types";

import { ViewModeSwitch } from "./ViewModeSwitch";

export function ApplicationsPageHeader(props: {
  view: ViewMode;
  onChangeView: (next: ViewMode) => void;
}) {
  const { view, onChangeView } = props;
  const { t } = useTranslation();

  return (
    <div className="flex items-start justify-between gap-md">
      <div>
        <div className="text-xl font-semibold text-foreground">
          {((t("applicationsPage.title", { defaultValue: "My applications", returnObjects: false }) ?? "My applications") as string)}
        </div>
        <div className="text-sm text-muted-foreground">
          {t(
            "applicationsPage.subtitle",
            "Create and track your job applications in one place."
          )}
        </div>
      </div>

      <ViewModeSwitch value={view} onChange={onChangeView} />
    </div>
  );
}
