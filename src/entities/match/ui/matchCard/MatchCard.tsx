// src/entities/loop/ui/matchCard/MatchCard.tsx

import React, { useMemo, useState } from "react";

import { labelStatus } from "src/entities/loop/lib";
import { LOOP_MATCH_STATUSES } from "src/entities/loop/model/constants";
import type { LoopMatchStatus } from "src/entities/loop/model/types";
import { classNames } from "src/shared/lib";
import { Card } from "src/shared/ui";

import { MatchDetailsModal, type MatchLike } from "./MatchDetailsModal";
import { formatMatchedAt, normalizePlatform } from "./matchFormat";

const selectClassName = classNames(
  "border bg-background text-foreground",
  "outline-none shadow-sm",
  "transition-colors duration-fast ease-ease-out",
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  "disabled:pointer-events-none disabled:opacity-50",
  "border-border",
  "h-10 px-sm text-sm",
  "rounded-xl"
);

function buildMetaParts(args: {
  location?: string;
  platform?: string;
  matchedAt?: string;
  loopName?: string;
}) {
  const { location, platform, matchedAt, loopName } = args;
  return [
    location || "—",
    platform || "—",
    matchedAt || "",
    loopName || "",
  ].filter(Boolean);
}

function MatchStatusSelect({
  status,
  busy,
  onChange,
}: {
  status: LoopMatchStatus;
  busy: boolean;
  onChange: (status: LoopMatchStatus) => void;
}) {
  return (
    <select
      aria-label="Match status"
      value={status}
      onChange={(e) => onChange(e.target.value as LoopMatchStatus)}
      disabled={busy}
      className={selectClassName}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {LOOP_MATCH_STATUSES.map((s) => (
        <option key={s.value} value={s.value}>
          {labelStatus(s.value)}
        </option>
      ))}
    </select>
  );
}

function MatchCardHeaderLine({
  title,
  company,
  metaParts,
}: {
  title: string;
  company: string;
  metaParts: string[];
}) {
  return (
    <div className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
      <span className="font-semibold text-foreground">{title || "—"}</span>
      <span className="ml-2 text-muted-foreground">{company || "—"}</span>

      {metaParts.length ? (
        <>
          <span className="mx-2 text-border" aria-hidden="true">
            •
          </span>
          {metaParts.map((t, idx) => (
            <React.Fragment key={`${t}-${idx}`}>
              <span className="text-muted-foreground">{t}</span>
              {idx < metaParts.length - 1 ? (
                <span className="mx-2 text-border" aria-hidden="true">
                  •
                </span>
              ) : null}
            </React.Fragment>
          ))}
        </>
      ) : null}
    </div>
  );
}

export function MatchCard({
  match,
  loopName,
  busy,
  onUpdateStatus,
  onDelete,
  onEdit,
}: {
  match: MatchLike;
  loopName: string;
  busy: boolean;
  onUpdateStatus: (matchId: string, status: LoopMatchStatus) => void;
  onDelete: (matchId: string) => void;
  onEdit: () => void;
}) {
  const [open, setOpen] = useState(false);

  const matchedAt = useMemo(
    () => formatMatchedAt(match.matchedAt),
    [match.matchedAt]
  );

  const platform = useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);

  const metaParts = useMemo(
    () =>
      buildMetaParts({
        location: match.location,
        platform,
        matchedAt,
        loopName,
      }),
    [match.location, platform, matchedAt, loopName]
  );

  return (
    <>
      {/* КЛИК ПО КАРТОЧКЕ ЦЕЛИКОМ */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setOpen(true);
        }}
        className={classNames(
          "rounded-xl",
          "outline-none",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        <Card
          variant="default"
          padding="md"
          shadow="sm"
          className="relative flex flex-col gap-sm"
        >
          <div className="absolute right-sm top-sm">
            <MatchStatusSelect
              status={match.status}
              busy={busy}
              onChange={(status) => onUpdateStatus(match.id, status)}
            />
          </div>

          <div className="min-w-0 pr-[140px]">
            <MatchCardHeaderLine
              title={match.title}
              company={match.company}
              metaParts={metaParts}
            />
          </div>
        </Card>
      </div>

      <MatchDetailsModal
        open={open}
        onOpenChange={setOpen}
        match={match}
        loopName={loopName}
        busy={busy}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </>
  );
}
