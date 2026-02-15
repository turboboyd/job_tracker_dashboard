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
import { Card } from "src/shared/ui";

export type BoardMatchCardViewProps = Readonly<{
  match: LoopMatch;
  loopName: string;
  busy: boolean;
  onDelete: (matchId: LoopMatch["id"]) => void | Promise<void>;
  overlay?: boolean;
}>;

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

      const ok = window.confirm(
        t("board.deleteConfirm", "Delete this job from the board?"),
      );
      if (!ok) return;

      Promise.resolve(onDelete(match.id)).catch(() => {});
    },
    [busy, overlay, onDelete, match.id, t],
  );

  const title = React.useMemo(
    () => String(match.title ?? "").trim() || "—",
    [match.title],
  );
  const company = React.useMemo(
    () => String(match.company ?? "").trim() || "—",
    [match.company],
  );
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
  }, [match.location, matchedAt, loopName, platform]);

  const url = React.useMemo(() => String(match.url ?? "").trim(), [match.url]);
  const hasUrl = Boolean(url);

  const onOpen = React.useCallback(() => {
    if (!busy && !overlay) setOpen(true);
  }, [busy, overlay]);
  let cursorClass: string;

  if (overlay) {
    cursorClass = "cursor-grabbing";
  } else if (busy) {
    cursorClass = "opacity-60 cursor-not-allowed";
  } else {
    cursorClass = "cursor-grab";
  }

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
          "rounded-xl outline-none",
          cursorClass,
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        )}
      >
        <Card
          variant="default"
          padding="md"
          shadow="sm"
          interactive={!overlay}
          className={classNames(
            "relative flex flex-col gap-sm",
            "transition-[box-shadow,transform] duration-fast ease-ease-out",
            !busy && !overlay && "hover:shadow-md hover:-translate-y-[1px]",
            overlay && "shadow-lg",
          )}
        >
          {!overlay ? (
            <button
              type="button"
              aria-label={t("board.delete", "Delete")}
              title={t("board.delete", "Delete")}
              disabled={busy}
              className={classNames(
                "absolute right-2 top-2",
                "inline-flex h-8 w-8 items-center justify-center rounded-full",
                "border border-border bg-card text-muted-foreground",
                "shadow-sm",
                "hover:bg-muted hover:text-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              onPointerDown={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={onQuickDelete}
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
              <span className="font-semibold text-foreground">{title}</span>
              <span className="ml-2 text-muted-foreground">{company}</span>
            </div>

            {meta ? (
              <div className="mt-1 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {meta}
              </div>
            ) : null}
          </div>

          {hasUrl ? (
            <div className="pt-2">
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:no-underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t("board.openLink", "Open link")}
              </a>
            </div>
          ) : null}
        </Card>
      </div>

      {!overlay ? (
        <MatchDetailsModal
          open={open}
          onOpenChange={setOpen}
          match={match}
          loopName={loopName}
          busy={busy}
          onDelete={(id) => {
            Promise.resolve(onDelete(id)).catch(() => {});
          }}
        />
      ) : null}
    </>
  );
}
