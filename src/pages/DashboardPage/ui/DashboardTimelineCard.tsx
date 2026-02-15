import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import type { LoopMatchStatus } from "src/entities/loopMatch";
import { Button, Card } from "src/shared/ui";

import { parseMs, normalizeStatus, diffDays } from "../model/dashboardTimeSeries";

type Props = {
  matches: {
    id: string;
    status?: unknown;
    createdAt?: unknown;
    updatedAt?: unknown;
    title?: string | null;
    company?: string | null;
  }[];
  days?: number;
  className?: string;
};

const STATUS_COLOR: Record<LoopMatchStatus, string> = {
  new: "#111827",
  saved: "#6B7280",
  applied: "#3B82F6",
  interview: "#8B5CF6",
  offer: "#10B981",
  rejected: "#EF4444",
};

export function DashboardTimelineCard({ matches, days = 14, className }: Props) {
  const { t, i18n } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();
  const [nowMs] = useState(() => Date.now());

  const rows = useMemo(() => {
    return matches
      .map((m) => {
        const when = parseMs(m.updatedAt) || parseMs(m.createdAt);
        const st = normalizeStatus(m.status);
        return {
          id: m.id,
          title: m.title ?? null,
          company: m.company ?? null,
          status: st,
          when,
        };
      })
      .filter(
        (
          x,
        ): x is {
          id: string;
          title: string | null;
          company: string | null;
          status: LoopMatchStatus;
          when: number;
        } => x.when != null && diffDays(x.when, nowMs) <= days,
      )
      .sort((a, b) => b.when - a.when)
      .slice(0, 24);
  }, [matches, days, nowMs]);

  return (
    <Card className={["flex h-full flex-col p-6", className].filter(Boolean).join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {t("timeline.title", "Timeline")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("timeline.subtitle", "Last {{days}} days", { days })}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          shape="pill"
          onClick={() => navigate(RoutePath[AppRoutes.MATCHES])}
        >
          {t("timeline.viewAll", "View all")}
        </Button>
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 text-sm text-muted-foreground">
          {t("timeline.empty", "No recent updates")}
        </div>
      ) : (
        <div className="mt-4 flex-1 space-y-3 overflow-y-auto pr-1">
          {rows.map((r) => (
            <button
              key={r.id}
              type="button"
              className="w-full rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/40"
              onClick={() => navigate(`${RoutePath[AppRoutes.MATCHES]}/${r.id}`)}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium text-foreground">
                    {r.title || t("recent.untitled", "Untitled")}
                  </div>
                  <div className="mt-0.5 truncate text-xs text-muted-foreground">
                    {r.company || t("recent.noCompany", "No company")}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: STATUS_COLOR[r.status] }}
                  />
                  <span className="text-xs text-muted-foreground">
                    {t(`status.${r.status}`, r.status)}
                  </span>
                </div>
              </div>

              <div className="mt-2 text-xs text-muted-foreground">
                {new Date(r.when).toLocaleDateString(i18n.language, {
                  year: "numeric",
                  month: "short",
                  day: "2-digit",
                })}
              </div>
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}
