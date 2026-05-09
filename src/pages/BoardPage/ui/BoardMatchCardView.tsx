import { Trash2 } from "lucide-react";
import React from "react";
import { useTranslation } from "react-i18next";

import { MatchDetailsModal, type LoopMatch } from "src/entities/loopMatch";
import { classNames } from "src/shared/lib";
import { Card } from "src/shared/ui";

import {
  buildBoardMatchCardViewModel,
  canOpenBoardMatchCard,
  getBoardMatchCursorClass,
} from "./BoardMatchCardView.helpers";

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
  const view = React.useMemo(
    () => buildBoardMatchCardViewModel(match, loopName),
    [match, loopName],
  );
  const cursorClass = getBoardMatchCursorClass({ busy, overlay });

  const onQuickDelete = React.useCallback(
    (event: React.SyntheticEvent) => {
      event.preventDefault();
      event.stopPropagation();
      if (busy || overlay) return;

      const confirmed = window.confirm(
        t("board.deleteConfirm", "Delete this job from the board?"),
      );
      if (!confirmed) return;

      Promise.resolve(onDelete(match.id)).catch(() => undefined);
    },
    [busy, overlay, onDelete, match.id, t],
  );

  const onOpen = React.useCallback(() => {
    if (canOpenBoardMatchCard({ busy, overlay })) {
      setOpen(true);
    }
  }, [busy, overlay]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") onOpen();
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
                "inline-flex h-10 w-10 md:h-8 md:w-8 items-center justify-center rounded-full",
                "border border-border bg-card text-muted-foreground",
                "shadow-sm",
                "hover:bg-muted hover:text-foreground",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
              onPointerDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={onQuickDelete}
            >
              <Trash2 className="h-5 w-5 md:h-4 md:w-4" />
            </button>
          ) : null}

          <div className="min-w-0">
            <div className="min-w-0 whitespace-nowrap overflow-hidden text-ellipsis text-sm">
              <span className="font-semibold text-foreground">{view.title}</span>
              <span className="ml-2 text-muted-foreground">{view.company}</span>
            </div>

            {view.meta ? (
              <div className="mt-1 text-xs text-muted-foreground whitespace-nowrap overflow-hidden text-ellipsis">
                {view.meta}
              </div>
            ) : null}
          </div>

          {view.hasUrl ? (
            <div className="pt-2">
              <a
                href={view.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary underline hover:no-underline"
                onClick={(event) => event.stopPropagation()}
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
            Promise.resolve(onDelete(id)).catch(() => undefined);
          }}
        />
      ) : null}
    </>
  );
}
