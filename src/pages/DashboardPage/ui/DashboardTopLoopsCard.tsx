import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { getBoardColumn, type BoardColumnKey, type StatusKey } from "src/entities/application/model/status";
import { Button, Card } from "src/shared/ui";

import { normalizeAppStatus } from "../model/dashboardTimeSeries";

type LoopLike = { id: string; name: string };
type MatchLike = { loopId?: string; status?: unknown };

type Row = {
  loopId: string;
  name: string;
  active: number;
  interview: number;
  offer: number;
  hired: number;
  total: number;
};

function inc(row: Row, st: StatusKey) {
  const col: BoardColumnKey = getBoardColumn(st);
  if (col === "ACTIVE") row.active += 1;
  if (col === "INTERVIEW") row.interview += 1;
  if (col === "OFFER") row.offer += 1;
  if (col === "HIRED") row.hired += 1;
  if (col !== "ARCHIVED") row.total += 1;
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
        active: 0,
        interview: 0,
        offer: 0,
        hired: 0,
        total: 0,
      });
    }

    for (const m of matches) {
      if (!m.loopId) continue;
      const row = byId.get(m.loopId);
      if (!row) continue;
      inc(row, normalizeAppStatus(m.status));
    }

    return Array.from(byId.values())
      .filter((r) => r.total > 0)
      .sort((a, b) => b.interview - a.interview || b.offer - a.offer || b.total - a.total)
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
                <span>{t("board.column.INTERVIEW", "Interview")}: {r.interview}</span>
                <span>{t("board.column.OFFER", "Offer")}: {r.offer}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
