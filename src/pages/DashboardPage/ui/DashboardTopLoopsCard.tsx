import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import type { LoopMatchStatus } from "src/entities/loopMatch";
import { Button, Card } from "src/shared/ui";

import { normalizeStatus } from "../model/dashboardTimeSeries";

type LoopLike = { id: string; name: string };
type MatchLike = { loopId?: string; status?: unknown };

type Row = {
  loopId: string;
  name: string;
  applied: number;
  interview: number;
  offer: number;
  rejected: number;
  total: number;
};

function inc(row: Row, st: LoopMatchStatus) {
  if (st === "applied") row.applied += 1;
  if (st === "interview") row.interview += 1;
  if (st === "offer") row.offer += 1;
  if (st === "rejected") row.rejected += 1;
  if (st !== "new" && st !== "saved") row.total += 1;
}

export function DashboardTopLoopsCard({
  loops,
  matches,
}: {
  loops: LoopLike[];
  matches: MatchLike[];
}) {
  const { t } = useTranslation(undefined, { keyPrefix: "dashboard" });
  const navigate = useNavigate();

  const rows = useMemo(() => {
    const byId = new Map<string, Row>();
    for (const l of loops) {
      byId.set(l.id, {
        loopId: l.id,
        name: l.name,
        applied: 0,
        interview: 0,
        offer: 0,
        rejected: 0,
        total: 0,
      });
    }

    for (const m of matches) {
      if (!m.loopId) continue;
      const row = byId.get(m.loopId);
      if (!row) continue;
      inc(row, normalizeStatus(m.status));
    }

    return Array.from(byId.values())
      .filter((r) => r.total > 0)
      .sort((a, b) => b.interview - a.interview || b.total - a.total)
      .slice(0, 5);
  }, [loops, matches]);

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-foreground">
            {t("topLoops.title", "Top loops")}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {t("topLoops.subtitle", "Where you get interviews")}
          </div>
        </div>

        <Button
          size="sm"
          variant="outline"
          shape="pill"
          onClick={() => navigate(RoutePath[AppRoutes.LOOPS])}
        >
          {t("topLoops.manage", "Manage")}
        </Button>
      </div>

      <div className="mt-4 space-y-2">
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            {t("topLoops.empty", "No data yet")}
          </div>
        ) : (
          rows.map((r) => (
            <div
              key={r.loopId}
              className="flex items-center justify-between rounded-lg border border-border bg-muted/20 px-3 py-2"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-medium text-foreground">{r.name}</div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t("topLoops.total", "In pipeline")}: {r.total}
                </div>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>{t("status.interview", "Interview")}: {r.interview}</span>
                <span>{t("status.offer", "Offer")}: {r.offer}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
