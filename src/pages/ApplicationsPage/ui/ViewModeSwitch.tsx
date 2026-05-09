import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import type { ViewMode } from "../model/types";

import {
  buildApplicationsViewModeOptions,
  createApplicationsPageTranslator,
} from "./applicationsPageUi.helpers";

interface ViewModeSwitchProps {
  onChange: (value: ViewMode) => void;
  value: ViewMode;
}

export function ViewModeSwitch({ onChange, value }: ViewModeSwitchProps) {
  const { t } = useTranslation();
  const text = createApplicationsPageTranslator(t);
  const viewOptions = buildApplicationsViewModeOptions(text);

  return (
    <div className="flex items-center gap-sm">
      {viewOptions.map((viewOption) => (
        <Button
          key={viewOption.value}
          size="sm"
          variant={value === viewOption.value ? "default" : "outline"}
          onClick={() => onChange(viewOption.value)}
        >
          {viewOption.label}
        </Button>
      ))}
    </div>
  );
}
