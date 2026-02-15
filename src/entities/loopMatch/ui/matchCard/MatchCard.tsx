import React from "react";
import { useTranslation } from "react-i18next";

import { classNames } from "src/shared/lib";
import { Button, Card } from "src/shared/ui";

import type { LoopMatch, LoopMatchStatus } from "../../model/types";

import { formatMatchedAt, normalizePlatform } from "./matchFormat";

type MatchCardProps = {
  match: LoopMatch;
  loopName: string;
  busy: boolean;
  onUpdateStatus: (matchId: LoopMatch["id"], status: LoopMatchStatus) => void;
  onDelete: (matchId: LoopMatch["id"]) => void;
  onEdit?: (matchId: LoopMatch["id"]) => void;
};

const STATUS_OPTIONS = [
  "new",
  "saved",
  "interview",
  "offer",
  "applied",
  "rejected",
] as const satisfies readonly LoopMatchStatus[];

export function MatchCard({
  match,
  loopName,
  busy,
  onUpdateStatus,
  onDelete,
  onEdit,
}: MatchCardProps) {
  const { t } = useTranslation();

  const matchedAt = React.useMemo(
    () => formatMatchedAt(match.matchedAt),
    [match.matchedAt],
  );

  const platform = React.useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);

  const meta = React.useMemo(() => {
    const parts = [match.location, platform, matchedAt, loopName]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return parts.join(" • ");
  }, [match.location, platform, matchedAt, loopName]);

  return (
    <Card variant="default" padding="md" shadow="sm" className="flex flex-col gap-sm">
      <div className="flex items-start justify-between gap-md">
        <div className="min-w-0">
          <div className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
            <span className="font-semibold text-foreground">{match.title || "—"}</span>
            <span className="ml-2 text-muted-foreground">{match.company || "—"}</span>
          </div>

          {meta ? (
            <div className="mt-1 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
              {meta}
            </div>
          ) : null}
        </div>

        <div className="flex items-center gap-sm">
          <StatusPill value={match.status} />
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-sm pt-xs">
        <label className="flex items-center gap-sm text-sm">
          <span className="text-muted-foreground">{t("matches.common.status")}</span>
          <select
            value={match.status}
            disabled={busy}
            onChange={(e) => onUpdateStatus(match.id, e.target.value as LoopMatchStatus)}
            className={classNames(
              "h-9 rounded-full px-sm",
              "border border-border bg-card text-foreground",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {t(`matches.status.${s}`)}
              </option>
            ))}
          </select>
        </label>

        <div className="flex items-center gap-sm">
          {onEdit ? (
            <Button
              variant="outline"
              size="sm"
              shape="pill"
              disabled={busy}
              onClick={() => onEdit(match.id)}
            >
              {t("matches.common.edit")}
            </Button>
          ) : null}

          <Button
            variant="outline"
            size="sm"
            shape="pill"
            disabled={busy}
            onClick={() => onDelete(match.id)}
          >
            {t("matches.common.delete")}
          </Button>
        </div>
      </div>
    </Card>
  );
}

type StatusPillProps = {
  value: LoopMatchStatus;
};

function StatusPill({ value }: StatusPillProps) {
  const { t } = useTranslation();
  return (
    <span
      className={classNames(
        "inline-flex items-center",
        "rounded-full px-sm py-[2px]",
        "text-xs font-medium",
        getStatusPalette(value),
      )}
    >
      {t(`matches.status.${value}`)}
    </span>
  );
}

function getStatusPalette(status: LoopMatchStatus) {
  switch (status) {
    case "new":
      return "bg-info text-info-foreground";
    case "saved":
      return "bg-secondary text-secondary-foreground";
    case "applied":
      return "bg-muted text-foreground";
    case "interview":
      return "bg-warning text-warning-foreground";
    case "offer":
      return "bg-success text-success-foreground";
    case "rejected":
      return "bg-destructive text-destructive-foreground";
    default:
      return "bg-muted text-foreground";
  }
}
