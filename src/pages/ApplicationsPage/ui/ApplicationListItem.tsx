import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { normalizeStatusKey, StatusDot, StatusLabel } from "src/entities/application";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

import type { AppRow } from "../model/types";

function getApplicationDetailsPath(applicationId: string): string {
  return `${RoutePath[AppRoutes.APPLICATIONS]}/${applicationId}`;
}

export function ApplicationListItem({ row }: { row: AppRow }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const statusKey = normalizeStatusKey(row.data.process.status);

  const matchingLabel = String(
    t("applicationsPage.matching", { defaultValue: "Match", returnObjects: false }),
  );
  const followUpLabel = String(
    t("applicationsPage.followUpBadge", { defaultValue: "Follow-up", returnObjects: false }),
  );

  return (
    <button
      type="button"
      onClick={() => void navigate(getApplicationDetailsPath(row.id))}
      className="w-full group py-3 px-3 flex items-center gap-3 text-left rounded-lg hover:bg-muted/50 transition-colors duration-150 -mx-1"
    >
      {/* Job info */}
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium text-foreground group-hover:text-primary transition-colors duration-150">
          {row.data.job.roleTitle}
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="truncate">{row.data.job.companyName}</span>
          {row.data.job.source ? (
            <>
              <span className="text-border">·</span>
              <span className="truncate">{row.data.job.source}</span>
            </>
          ) : null}
        </div>
        {row.data.matching ? (
          <div className="mt-1 text-[11px] text-muted-foreground">
            {matchingLabel}: <span className="font-medium text-foreground">{row.data.matching.score}/100</span>
            {" – "}{row.data.matching.decision}
          </div>
        ) : null}
      </div>

      {/* Badges */}
      <div className="flex items-center gap-2 shrink-0">
        {row.data.process.needsFollowUp ? (
          <span className="hidden sm:inline-flex items-center rounded-md bg-warning/20 px-2 py-0.5 text-[11px] font-medium text-warning-foreground border border-warning/30">
            {followUpLabel}
          </span>
        ) : null}

        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground whitespace-nowrap">
          {statusKey ? <StatusDot status={statusKey} /> : null}
          <span>
            {statusKey ? (
              <StatusLabel status={statusKey} fallback={String(row.data.process.status)} />
            ) : (
              String(row.data.process.status)
            )}
          </span>
        </div>
      </div>
    </button>
  );
}
