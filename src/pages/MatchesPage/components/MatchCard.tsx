import React, { useMemo } from "react";

import { labelStatus, prettyStatus } from "src/entities/loop/lib";
import { LOOP_MATCH_STATUSES } from "src/entities/loop/model/constants";
import type { LoopMatchStatus } from "src/entities/loop/model/types";
import { Button, Card } from "src/shared/ui";

export function MatchCard({
  match,
  loopName,
  busy,
  onUpdateStatus,
  onDelete,
}: {
  match: {
    id: string;
    loopId: string;
    title: string;
    company: string;
    location: string;
    platform: unknown;
    url: string;
    status: LoopMatchStatus;
    matchedAt?: string | null;
  };
  loopName: string;
  busy: boolean;
  onUpdateStatus: (matchId: string, status: LoopMatchStatus) => void;
  onDelete: (matchId: string) => void;
}) {
  const matchedAt = useMemo(() => {
    if (!match.matchedAt) return null;
    const d = new Date(match.matchedAt);
    if (Number.isNaN(d.getTime())) return null;
    return d.toLocaleDateString();
  }, [match.matchedAt]);

  const platform = String(match.platform ?? "").toUpperCase();

  return (
    <Card className="flex flex-col gap-md rounded-lg border border-border bg-card p-md shadow-sm">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <a
            href={match.url}
            target="_blank"
            rel="noreferrer"
            className="block truncate text-lg font-semibold text-foreground underline underline-offset-2"
            title={match.title}
          >
            {match.title}
          </a>

          <div className="mt-sm flex flex-wrap items-center gap-x-md gap-y-sm text-sm text-muted-foreground">
            <span className="truncate">{match.company || "—"}</span>
            <span className="text-border">•</span>
            <span className="truncate">{match.location || "—"}</span>
            <span className="text-border">•</span>
            <span className="truncate">{platform || "—"}</span>

            {matchedAt ? (
              <>
                <span className="text-border">•</span>
                <span className="truncate">{matchedAt}</span>
              </>
            ) : null}

            {loopName ? (
              <>
                <span className="text-border">•</span>
                <span className="truncate">{loopName}</span>
              </>
            ) : null}
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          shape="pill"
          disabled={busy}
          onClick={() => onDelete(match.id)}
        >
          Delete
        </Button>
      </div>

      <div className="flex flex-wrap items-start gap-md">
        <div>
          <select
            value={match.status}
            onChange={(e) => onUpdateStatus(match.id, e.target.value as LoopMatchStatus)}
            disabled={busy}
            className="h-9 rounded-md border border-border bg-background px-md text-sm text-foreground"
          >
            {LOOP_MATCH_STATUSES.map((s) => (
              <option key={s.value} value={s.value}>
                {labelStatus(s.value)}
              </option>
            ))}
          </select>

          <div className="mt-sm text-xs text-muted-foreground">{prettyStatus(match.status)}</div>
        </div>
      </div>
    </Card>
  );
}
