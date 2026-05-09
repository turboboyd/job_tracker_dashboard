import { useTranslation } from "react-i18next";

import type { ViewMode } from "../model/types";

import {
  createApplicationsPageTranslator,
  getApplicationsCountLabel,
  getApplicationsViewHint,
} from "./applicationsPageUi.helpers";

interface ViewMetaBarProps {
  count: number;
  isLoading: boolean;
  view: ViewMode;
}

export function ViewMetaBar({ count, isLoading, view }: ViewMetaBarProps) {
  const { t } = useTranslation();
  const text = createApplicationsPageTranslator(t);

  const hint = getApplicationsViewHint(text, view);
  const countLabel = getApplicationsCountLabel(text, isLoading, count);

  return (
    <div className="flex items-center justify-between">
      <div className="text-xs text-muted-foreground">{hint}</div>
      <div className="text-xs text-muted-foreground">{countLabel}</div>
    </div>
  );
}
