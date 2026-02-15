import { useTranslation } from "react-i18next";

import { KpiCard, CardButton, Button } from "src/shared/ui";
import { Card } from "src/shared/ui/Card/Card";

import { DashboardIcon } from "../DashboardIcon";

type Summary = {
  total: number;
  new: number;
  applied: number;
  saved: number;
  interview: number;
  offer: number;
  rejected: number;
};

type Status = "new" | "applied" | "interview" | "offer" | "rejected";

type Props = {
  isLoading: boolean;
  error?: string | null;
  summary: Summary;
  onGoJobs?: (status?: Status) => void;

  onAddFirstJob?: () => void;
};

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
        <div className="text-sm font-medium text-foreground">
          Couldn’t load jobs
        </div>
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

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
          <MiniStat label={t("status.new", "New")} value={0} />
          <MiniStat label={t("status.applied", "Applied")} value={0} />
          <MiniStat label={t("status.interview", "Interview")} value={0} />
          <MiniStat label={t("status.offer", "Offer")} value={0} />
          <MiniStat label={t("status.rejected", "Rejected")} value={0} />
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-lg font-semibold text-foreground">
        {t("stats.title", "Statistics")}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        <CardButton onClick={() => onGoJobs?.("new")}>
          <KpiCard
            title={t("status.new", "New")}
            value={summary.new}
            icon={<DashboardIcon name="new" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("applied")}>
          <KpiCard
            title={t("status.applied", "Applied")}
            value={summary.applied}
            icon={<DashboardIcon name="applied" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("interview")}>
          <KpiCard
            title={t("status.interview", "Interview")}
            value={summary.interview}
            icon={<DashboardIcon name="interview" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("offer")}>
          <KpiCard
            title={t("status.offer", "Offer")}
            value={summary.offer}
            icon={<DashboardIcon name="offer" />}
          />
        </CardButton>

        <CardButton onClick={() => onGoJobs?.("rejected")}>
          <KpiCard
            title={t("status.rejected", "Rejected")}
            value={summary.rejected}
            icon={<DashboardIcon name="rejected" />}
          />
        </CardButton>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-border bg-background p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-lg font-semibold text-foreground">{value}</div>
    </div>
  );
}
