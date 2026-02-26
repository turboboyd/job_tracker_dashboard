import { useTranslation } from "react-i18next";

import { normalizeStatusKey, type StatusKey } from "src/entities/application/model/status";
import { StatusDot } from "src/entities/application/ui/StatusKit";
import { Button } from "src/shared/ui";

import { PIPELINE_STATUSES, processStatusKey, type PipelineFilterStatus } from "../model/types";

export function PipelineStatusTabs(props: {
  activeStatus: PipelineFilterStatus;
  onChange: (status: PipelineFilterStatus) => void;
  isLoading: boolean;
  count: number;
}) {
  const { t } = useTranslation();
  const { activeStatus, onChange, isLoading, count } = props;

  return (
    <div className="space-y-sm">
      <div className="flex flex-wrap items-center gap-sm">
        {PIPELINE_STATUSES.map((s) => {
          const fallback = (t(processStatusKey(s.status), {
            defaultValue: String(s.status),
            returnObjects: false,
          }) ?? String(s.status)) as string;

          const label =
            ((t(`applicationsPage.pipeline.${s.key}`, {
              defaultValue: fallback,
              returnObjects: false,
            }) ?? fallback) as string);

          const sk: StatusKey | null =
            s.status === "ALL" ? null : (normalizeStatusKey(s.status) as StatusKey | null);

          return (
            <Button
              key={s.key}
              variant={activeStatus === s.status ? "default" : "outline"}
              size="sm"
              onClick={() => onChange(s.status)}
            >
              <span className="inline-flex items-center gap-2">
                {sk ? <StatusDot status={sk} /> : null}
                <span>{label}</span>
              </span>
            </Button>
          );
        })}

        <div className="ml-auto text-xs text-muted-foreground">
          {isLoading
            ? ((t("applicationsPage.pipeline.loading", {
                defaultValue: "Loading…",
                returnObjects: false,
              }) ?? "Loading…") as string)
            : ((t("applicationsPage.pipeline.count", {
                defaultValue: "Count: {{count}}",
                count,
                returnObjects: false,
              }) ?? `Count: ${count}`) as string)}
        </div>
      </div>
    </div>
  );
}
