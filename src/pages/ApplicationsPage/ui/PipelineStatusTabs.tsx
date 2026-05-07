import { useTranslation } from "react-i18next";

import { normalizeStatusKey, type StatusKey } from "src/entities/application/model/status";
import { StatusDot } from "src/entities/application/ui/StatusKit";

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
    <div className="flex items-end gap-0.5 overflow-x-auto">
      {PIPELINE_STATUSES.map((s) => {
        const fallback = (t(processStatusKey(s.status), {
          defaultValue: String(s.status),
          returnObjects: false,
        }) ?? String(s.status)) as string;

        const label = ((t(`applicationsPage.pipeline.${s.key}`, {
          defaultValue: fallback,
          returnObjects: false,
        }) ?? fallback) as string);

        const sk: StatusKey | null =
          s.status === "ALL" ? null : (normalizeStatusKey(s.status) as StatusKey | null);

        const isActive = activeStatus === s.status;

        return (
          <button
            key={s.key}
            type="button"
            onClick={() => onChange(s.status)}
            className={[
              "-mb-px px-3.5 py-2 text-[13px] transition-colors cursor-pointer select-none",
              "inline-flex items-center gap-1.5 whitespace-nowrap",
              isActive
                ? "border-b-2 border-primary font-medium text-foreground"
                : "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
            ].join(" ")}
          >
            {sk ? <StatusDot status={sk} /> : null}
            <span>{label}</span>
            <span className={[
              "text-[10.5px] px-1.5 py-px rounded-full border",
              "font-variant-numeric tabular-nums",
              isActive
                ? "bg-muted border-border text-foreground"
                : "bg-muted border-border text-subtle-foreground",
            ].join(" ")}>
              {isLoading ? "…" : count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
