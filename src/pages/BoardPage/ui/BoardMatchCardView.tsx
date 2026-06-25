import { Archive } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { classNames } from "src/shared/lib";

import type { BoardCardItem } from "../model/types";

import {
  buildBoardCardViewModel,
  canOpenBoardCard,
  getBoardCardCursorClass,
} from "./BoardMatchCardView.helpers";

export type BoardMatchCardViewProps = Readonly<{
  item: BoardCardItem;
  loopName: string;
  busy: boolean;
  onArchive: (itemId: BoardCardItem["id"]) => void | Promise<void>;
  overlay?: boolean;
}>;

function getMatchBarColor(score: number): string {
  if (score >= 85) return "bg-emerald-500";
  if (score >= 70) return "bg-primary";
  return "bg-muted-foreground/40";
}

export function BoardMatchCardView({
  item,
  loopName,
  busy,
  onArchive,
  overlay = false,
}: BoardMatchCardViewProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const card = buildBoardCardViewModel(item, loopName);

  const onOpen = React.useCallback(() => {
    if (canOpenBoardCard({ busy, overlay })) {
      navigate(`/dashboard/applications/${item.id}`);
    }
  }, [busy, overlay, navigate, item.id]);

  const onArchiveClick = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy || overlay) return;
      const ok = window.confirm(t("board.archiveConfirm", "Архивировать заявку?"));
      if (!ok) return;
      Promise.resolve(onArchive(item.id)).catch(() => {});
    },
    [busy, overlay, onArchive, item.id, t],
  );

  const cursorClass = getBoardCardCursorClass({ busy, overlay });
  const score = Math.min(100, Math.max(0, card.score));

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpen();
      }}
      className={classNames(
        "group relative rounded-[8px] border border-border bg-card p-3 outline-none shadow-sm",
        "transition-[border-color,transform,box-shadow] duration-[120ms]",
        !busy && !overlay && "hover:border-border-strong hover:-translate-y-px",
        overlay && "shadow-lg",
        cursorClass,
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      {/* Archive button — appears on hover */}
      {!overlay && (
        <button
          type="button"
          aria-label={t("board.archive", "Архивировать")}
          disabled={busy}
          className={classNames(
            "absolute right-2 top-2 z-10",
            "flex h-6 w-6 items-center justify-center rounded-[4px]",
            "border border-border bg-card text-muted-foreground",
            "opacity-0 group-hover:opacity-100 transition-opacity",
            "hover:bg-muted hover:text-foreground",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
          onPointerDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onClick={onArchiveClick}
        >
          <Archive className="h-3 w-3" />
        </button>
      )}

      {/* Top: avatar + role + company */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
          {card.initial}
        </div>
        <div className="min-w-0 flex-1 pr-5">
          <div className="truncate text-[12.5px] font-medium tracking-[-0.005em] text-foreground leading-tight">
            {item.isFavorite && <span className="mr-1 text-amber-500">★</span>}
            {card.title}
          </div>
          <div className="truncate text-[11px] text-subtle-foreground leading-tight mt-0.5">
            {card.company}
          </div>
        </div>
      </div>

      {/* Location */}
      {card.location && (
        <div className="mb-2 text-[11px] text-subtle-foreground truncate">
          {card.location}
        </div>
      )}

      {/* Loop linkage — optional metadata */}
      {card.loopName && (
        <div className="flex flex-wrap gap-1 mb-2">
          <span className="rounded-[4px] border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground truncate max-w-[160px]">
            {card.loopName}
          </span>
        </div>
      )}

      {/* Footer: date | optional CV match score */}
      <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
        <span className="text-[10.5px] text-subtle-foreground tabular-nums">
          {card.dateLabel || "—"}
        </span>
        {card.hasScore && (
          <span className="inline-flex items-center gap-1.5">
            <span className="block h-[3px] w-6 overflow-hidden rounded-full bg-muted">
              <span
                className={classNames("block h-full rounded-full", getMatchBarColor(card.score))}
                style={{ width: `${score}%` }}
              />
            </span>
            <span className="text-[10.5px] tabular-nums text-muted-foreground">
              {card.score}
            </span>
          </span>
        )}
      </div>
    </div>
  );
}
