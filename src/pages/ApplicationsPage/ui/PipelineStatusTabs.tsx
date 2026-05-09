import { useTranslation } from "react-i18next";

import { StatusDot } from "src/entities/application";
import { Button } from "src/shared/ui";

import type { PipelineFilterStatus } from "../model/types";

import {
  buildApplicationsPipelineStatusOptions,
  createApplicationsPageTranslator,
  getApplicationsCountLabel,
} from "./applicationsPageUi.helpers";

interface PipelineStatusTabsProps {
  activeStatus: PipelineFilterStatus;
  count: number;
  isLoading: boolean;
  onChange: (status: PipelineFilterStatus) => void;
}

export function PipelineStatusTabs({
  activeStatus,
  count,
  isLoading,
  onChange,
}: PipelineStatusTabsProps) {
  const { t } = useTranslation();
  const text = createApplicationsPageTranslator(t);

  const statusOptions = buildApplicationsPipelineStatusOptions(text);
  const countLabel = getApplicationsCountLabel(text, isLoading, count);

  return (
    <div className="space-y-sm">
      <div className="flex flex-wrap items-center gap-sm">
        {statusOptions.map((statusOption) => (
          <Button
            key={statusOption.key}
            variant={activeStatus === statusOption.status ? "default" : "outline"}
            size="sm"
            onClick={() => onChange(statusOption.status)}
          >
            <span className="inline-flex items-center gap-2">
              {statusOption.statusKey ? <StatusDot status={statusOption.statusKey} /> : null}
              <span>{statusOption.label}</span>
            </span>
          </Button>
        ))}

        <div className="ml-auto text-xs text-muted-foreground">{countLabel}</div>
      </div>
    </div>
  );
}
