import { Plus } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui/Button";

import type { ViewMode } from "../model/types";

import {
  buildApplicationsHeaderLabels,
  createApplicationsPageTranslator,
} from "./applicationsPageUi.helpers";
import { ViewModeSwitch } from "./ViewModeSwitch";

interface ApplicationsPageHeaderProps {
  onChangeView: (next: ViewMode) => void;
  view: ViewMode;
  onNewApplication: () => void;
}

export function ApplicationsPageHeader({
  onChangeView,
  view,
  onNewApplication,
}: ApplicationsPageHeaderProps) {
  const { t } = useTranslation();
  const text = createApplicationsPageTranslator(t);
  const labels = buildApplicationsHeaderLabels(text);
  const newAppLabel = String(
    t("applicationsPage.create.newBtn", {
      defaultValue: "New application",
      returnObjects: false,
    }),
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="text-2xl font-semibold tracking-tight text-foreground">
          {labels.title}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">{labels.subtitle}</div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <ViewModeSwitch value={view} onChange={onChangeView} />
        <Button
          size="default"
          variant="default"
          shape="md"
          onClick={onNewApplication}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          {newAppLabel}
        </Button>
      </div>
    </div>
  );
}
