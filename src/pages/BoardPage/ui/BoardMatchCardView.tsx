import { Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import {
  MatchDetailsModal,
  formatMatchedAt,
  normalizePlatform,
  type LoopMatch,
} from "src/entities/loopMatch";
import { classNames } from "src/shared/lib";

export type BoardMatchCardViewProps = Readonly<{
  match: LoopMatch;
  loopName: string;
  busy: boolean;
  onDelete: (matchId: LoopMatch["id"]) => void | Promise<void>;
  overlay?: boolean;
}>;

function getInitial(name: string): string {
  return (name || "?").trim().charAt(0).toUpperCase();
}

export function BoardMatchCardView({
  match,
  loopName,
  busy,
  onDelete,
  overlay = false,
}: BoardMatchCardViewProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);

  const onQuickDelete = React.useCallback(
    (e: React.SyntheticEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (busy || overlay) return;
      const ok = window.confirm(t("board.deleteConfirm", "Delete this job from the board?"));
      if (!ok) return;
      Promise.resolve(onDelete(match.id)).catch(() => {});
    },
    [busy, overlay, onDelete, match.id, t],
  );

  const title    = React.useMemo(() => String(match.title   ?? "").trim() || "—", [match.title]);
  const company  = React.useMemo(() => String(match.company ?? "").trim() || "—", [match.company]);
  const location = React.useMemo(() => String(match.location ?? "").trim(),        [match.location]);
  const platform = React.useMemo(() => {
    const p = normalizePlatform(match.platform);
    return p ? p.toUpperCase() : "";
  }, [match.platform]);
  const matchedAt = React.useMemo(() => formatMatchedAt(match.matchedAt), [match.matchedAt]);
  const url = React.useMemo(() => String(match.url ?? "").trim(), [match.url]);

  const onOpen = React.useCallback(() => {
    if (!busy && !overlay) setOpen(true);
  }, [busy, overlay]);

  let cursorClass: string;
  if (overlay)      cursorClass = "cursor-grabbing";
  else if (busy)    cursorClass = "opacity-60 cursor-not-allowed";
  else              cursorClass = "cursor-pointer md:cursor-grab";

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onOpen();
        }}
        className={classNames(
          "group relative rounded-[8px] border border-border bg-card p-3 outline-none",
          "transition-[border-color,transform,box-shadow] duration-[120ms]",
          !busy && !overlay && "hover:border-border-strong hover:-translate-y-px hover:shadow-sm",
          overlay && "shadow-lg",
          cursorClass,
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        {/* Delete button — appears on hover */}
        {!overlay && (
          <button
            type="button"
            aria-label={t("board.delete", "Delete")}
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
            onClick={onQuickDelete}
          >
            <Trash2 className="h-3 w-3" />
          </button>
        )}

        {/* Top: avatar + role + company */}
        <div className="flex items-start gap-2 mb-1.5">
          <div className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-[5px] border border-border bg-muted text-[10px] font-semibold uppercase text-muted-foreground">
            {getInitial(company)}
          </div>
          <div className="min-w-0 flex-1 pr-5">
            <div className="truncate text-[12.5px] font-medium tracking-[-0.005em] text-foreground leading-tight">
              {title}
            </div>
            <div className="truncate text-[11px] text-muted-foreground leading-tight mt-0.5">
              {company}
            </div>
          </div>
        </div>

        {/* Location */}
        {location && (
          <div className="mb-2 text-[11px] text-muted-foreground truncate">
            {location}
          </div>
        )}

        {/* Tags — platform + loop as pills */}
        {(platform || loopName) && (
          <div className="flex flex-wrap gap-1 mb-2">
            {platform && (
              <span className="rounded-[4px] border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground">
                {platform}
              </span>
            )}
            {loopName && (
              <span className="rounded-[4px] border border-border bg-muted px-1.5 py-px text-[10px] text-muted-foreground truncate max-w-[120px]">
                {loopName}
              </span>
            )}
          </div>
        )}

        {/* Open link — subtle, no underline by default */}
        {url && (
          <div className="mb-2">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10.5px] text-primary hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {t("board.openLink", "Открыть вакансию")} ↗
            </a>
          </div>
        )}

        {/* Footer: date | match bar */}
        <div className="flex items-center justify-between gap-2 border-t border-border pt-1.5">
          <span className="text-[10.5px] text-muted-foreground tabular-nums">
            {matchedAt}
          </span>
          {/* Compact match bar — always shown (no score in model, show placeholder) */}
          <span className="inline-flex items-center gap-1.5">
            <span className="block h-[3px] w-6 overflow-hidden rounded-full bg-muted">
              <span className="block h-full w-[70%] rounded-full bg-primary/50" />
            </span>
          </span>
        </div>
      </div>

      {!overlay ? (
        <MatchDetailsModal
          open={open}
          onOpenChange={setOpen}
          match={match}
          loopName={loopName}
          busy={busy}
          onDelete={(id) => { Promise.resolve(onDelete(id)).catch(() => {}); }}
        />
      ) : null}
    </>
  );
}
