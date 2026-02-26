import { useTranslation } from "react-i18next";

import type { BoardColumnKey } from "src/entities/application/model/status";
import { BOARD_COLUMN_COLOR, STATUS_COLOR_DOT_CLASS } from "src/entities/application/model/status";
import { KpiCard, CardButton, Button } from "src/shared/ui";
import { Card } from "src/shared/ui/Card/Card";

import { DashboardIcon } from "../DashboardIcon";


type Summary = {
  total: number;
  byColumn: Record<BoardColumnKey, number>;
};

type Status = BoardColumnKey;

type Props = {
  isLoading: boolean;
  error?: string | null;
  summary: Summary;
  onGoJobs?: (status?: Status) => void;

  onAddFirstJob?: () => void;
};

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-muted/30 p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-base font-semibold text-foreground">{value}</div>
    </div>
  );
}

function StatusTitle({ col, label }: { col: BoardColumnKey; label: string }) {
  const color = BOARD_COLUMN_COLOR[col];
  return (
    <span className="inline-flex items-center gap-2">
      <span className={"h-2 w-2 rounded-full " + STATUS_COLOR_DOT_CLASS[color]} />
      <span>{label}</span>
    </span>
  );
}

export function DashboardStats({
  isLoading,
  error,
  summary,
  onGoJobs,
  onAddFirstJob,
}: Props) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });

  if (isLoading) {
    return (
      <Card padding="md" className="rounded-3xl">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="md" className="rounded-3xl">
        <div className="text-sm font-medium text-foreground">Couldn’t load jobs</div>
        <div className="mt-1 text-sm text-muted-foreground">{error}</div>
      </Card>
    );
  }

  if (summary.total === 0) {
    return (
      <Card padding="md" className="rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-base font-semibold text-foreground">
              {t("stats.empty.title", "Add your first job")}
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              {t(
                "stats.empty.subtitle",
                "Start tracking your applications — your statistics will appear here.",
              )}
            </div>
          </div>

          <Button variant="outline" shadow="sm" onClick={onAddFirstJob}>
            {t("stats.empty.cta", "Add job")}
          </Button>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <MiniStat label={t("board.column.ACTIVE", "Active")} value={0} />
          <MiniStat label={t("board.column.INTERVIEW", "Interview")} value={0} />
          <MiniStat label={t("board.column.OFFER", "Offer")} value={0} />
          <MiniStat label={t("board.column.HIRED", "Hired")} value={0} />
          <MiniStat label={t("board.column.REJECTED", "Rejected")} value={0} />
          <MiniStat label={t("board.column.NO_RESPONSE", "No response")} value={0} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold text-foreground">{t("stats.title", "Statistics")}</div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <CardButton onClick={() => onGoJobs?.("ACTIVE")}>
          <KpiCard
            title={<StatusTitle col="ACTIVE" label={t("board.column.ACTIVE", "Active")} />}
            value={summary.byColumn.ACTIVE}
            icon={<DashboardIcon name="applied" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("INTERVIEW")}>
          <KpiCard
            title={<StatusTitle col="INTERVIEW" label={t("board.column.INTERVIEW", "Interview")} />}
            value={summary.byColumn.INTERVIEW}
            icon={<DashboardIcon name="interview" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("OFFER")}>
          <KpiCard
            title={<StatusTitle col="OFFER" label={t("board.column.OFFER", "Offer")} />}
            value={summary.byColumn.OFFER}
            icon={<DashboardIcon name="offer" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("HIRED")}>
          <KpiCard
            title={<StatusTitle col="HIRED" label={t("board.column.HIRED", "Hired")} />}
            value={summary.byColumn.HIRED}
            icon={<DashboardIcon name="hired" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("REJECTED")}>
          <KpiCard
            title={<StatusTitle col="REJECTED" label={t("board.column.REJECTED", "Rejected")} />}
            value={summary.byColumn.REJECTED}
            icon={<DashboardIcon name="rejected" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("NO_RESPONSE")}> 
          <KpiCard
            title={<StatusTitle col="NO_RESPONSE" label={t("board.column.NO_RESPONSE", "No response")} />}
            value={summary.byColumn.NO_RESPONSE}
            icon={<DashboardIcon name="no_response" />}
          />
        </CardButton>
      </div>
    </div>
  );
}
