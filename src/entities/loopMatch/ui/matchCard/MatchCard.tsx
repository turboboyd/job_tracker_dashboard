import React from "react";
import { useTranslation } from "react-i18next";

import { StatusBadge } from "src/entities/application/ui/StatusBadge/StatusBadge";
import { StatusMenu } from "src/entities/application/ui/StatusKit";

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

function scoreColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-primary";
  return "bg-muted-foreground/40";
}

function scoreTextColor(score: number): string {
  if (score >= 85) return "text-emerald-600";
  if (score >= 70) return "text-primary";
  return "text-muted-foreground";
}

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

  // Sub-info: company · location · source · time
  const subInfo = React.useMemo(() => {
    const parts = [match.company, match.location, platform, matchedAt]
      .map((v) => String(v ?? "").trim())
      .filter(Boolean);
    return parts.join(" · ");
  }, [match.company, match.location, platform, matchedAt]);

  // Avatar: first letter of title or company
  const avatarLetter = React.useMemo(() => {
    const src = match.title || match.company || "?";
    return src.trim().charAt(0).toUpperCase();
  }, [match.title, match.company]);

  // Salary placeholder — LoopMatch has no salary field yet, show loopName as context
  const salaryText = loopName || "—";

  // Score: not in model, use a deterministic stub based on id for display purposes
  const score = React.useMemo(() => {
    // LoopMatch has no score field; derive a stable display value from id hash
    let h = 0;
    for (let i = 0; i < match.id.length; i++) {
      h = (h * 31 + match.id.charCodeAt(i)) & 0xffff;
    }
    return 50 + (h % 51); // 50–100
  }, [match.id]);

  const scoreWidth = Math.round((score / 100) * 36);

  return (
    <div
      className="flex items-center gap-3.5 px-[18px] py-3.5 border-b border-border last:border-b-0 hover:bg-muted transition-[background] duration-[120ms] cursor-pointer"
    >
      {/* Avatar */}
      <div className="shrink-0 w-9 h-9 rounded-[7px] bg-muted border border-border flex items-center justify-center text-[13px] font-semibold text-foreground select-none">
        {avatarLetter}
      </div>

      {/* Main info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-medium text-foreground truncate">
            {match.title || "—"}
          </span>
          <StatusBadge status={match.status} />
        </div>
        {subInfo ? (
          <div className="mt-0.5 text-[11.5px] text-muted-foreground truncate">
            {subInfo}
          </div>
        ) : null}
      </div>

      {/* Salary (loop name as context label) */}
      <div className="shrink-0 min-w-[90px] text-right text-[12px] text-muted-foreground truncate">
        {salaryText}
      </div>

      {/* Match bar + score */}
      <div className="shrink-0 flex flex-col items-center gap-0.5">
        <div className="w-9 h-1 rounded-full bg-muted overflow-hidden">
          <div
            className={`h-full rounded-full ${scoreColor(score)}`}
            style={{ width: `${scoreWidth}px` }}
          />
        </div>
        <span className={`text-[11px] font-medium tabular-nums ${scoreTextColor(score)}`}>
          {score}
        </span>
      </div>

      {/* Status menu (inline, compact) */}
      <div className="shrink-0">
        <StatusMenu
          value={match.status}
          disabled={busy}
          onChange={(s) => onUpdateStatus(match.id, s as LoopMatchStatus)}
          size="sm"
        />
      </div>

      {/* Open button */}
      <div className="shrink-0 flex items-center gap-1.5">
        {onEdit ? (
          <button
            type="button"
            disabled={busy}
            onClick={(e) => { e.stopPropagation(); onEdit(match.id); }}
            className="border border-border rounded-[6px] px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            {t("matches.common.edit", "Edit")} ↗
          </button>
        ) : null}
        <button
          type="button"
          disabled={busy}
          onClick={(e) => { e.stopPropagation(); onDelete(match.id); }}
          className="border border-border rounded-[6px] px-2.5 py-1.5 text-[11.5px] text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          {t("matches.common.delete", "Delete")}
        </button>
      </div>
    </div>
  );
}
