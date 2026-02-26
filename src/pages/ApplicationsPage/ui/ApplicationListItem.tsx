import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { normalizeStatusKey, type StatusKey } from "src/entities/application/model/status";
import { StatusDot, StatusLabel } from "src/entities/application/ui/StatusKit";

import type { AppRow } from "../model/useApplicationsPage";

export function ApplicationListItem(props: { row: AppRow }) {
  const { row } = props;
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate(`/dashboard/applications/${row.id}`)}
      className="w-full py-sm flex items-center gap-md text-left hover:bg-muted/40 rounded-md px-2"
    >
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground">
          {row.data.job.roleTitle}
        </div>
        <div className="truncate text-xs text-muted-foreground">
          {row.data.job.companyName}
          {row.data.job.source ? ` • ${row.data.job.source}` : ""}
        </div>
        {row.data.matching ? (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {((t("applicationsPage.matching", { defaultValue: "Match", returnObjects: false }) ?? "Match") as string)}: {row.data.matching.score}
            /100 • {row.data.matching.decision}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-sm shrink-0">
        {row.data.process.needsFollowUp ? (
          <span className="rounded-full border border-border bg-background px-2 py-1 text-[11px] font-medium text-foreground">
            {((t("applicationsPage.followUpBadge", { defaultValue: "Follow-up", returnObjects: false }) ?? "Follow-up") as string)}
          </span>
        ) : null}
        {(() => {
          const sk = normalizeStatusKey(row.data.process.status) as StatusKey | null;
          return (
            <div className="flex items-center gap-2 rounded-full border border-border bg-background px-sm py-1 text-[11px] font-medium text-foreground">
              {sk ? <StatusDot status={sk} /> : null}
              <span className="text-foreground">
                {sk ? <StatusLabel status={sk} fallback={String(row.data.process.status)} /> : String(row.data.process.status)}
              </span>
            </div>
          );
        })()}
      </div>
    </button>
  );
}
