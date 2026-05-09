import type { Loop } from "src/entities/loop";
import { Pagination } from "src/shared/ui";

import { LoopListCard } from "./LoopListCard";
import type { LoopsListTranslate } from "./loopsListView.types";

export function LoopsListMessage({ children }: { children: string }) {
  return <div className="text-sm text-muted-foreground">{children}</div>;
}

function getRemoteText(loop: Loop, t: LoopsListTranslate) {
  return loop.remoteMode === "remote_only"
    ? t("loops.remoteOnly", "Remote")
    : t("loops.any", "Any");
}

interface LoopsCardsListProps {
  items: Loop[];
  onOpenLoop: (id: string) => void;
  t: LoopsListTranslate;
}

export function LoopsCardsList({ items, onOpenLoop, t }: LoopsCardsListProps) {
  return (
    <div className="space-y-3">
      {items.map((loop) => (
        <LoopListCard
          key={loop.id}
          loop={loop}
          onOpen={onOpenLoop}
          remoteText={getRemoteText(loop, t)}
          emptyTitlesLabel={t("loops.dash", "—")}
        />
      ))}
    </div>
  );
}

interface LoopsPaginationSummaryProps {
  disabled: boolean;
  onPageChange: (nextPage: number) => void;
  page: number;
  showFrom: number;
  showTo: number;
  t: LoopsListTranslate;
  total: number;
  totalPages: number;
}

export function LoopsPaginationSummary({
  page,
  totalPages,
  total,
  showFrom,
  showTo,
  disabled,
  onPageChange,
  t,
}: LoopsPaginationSummaryProps) {
  return (
    <div className="grid grid-cols-3 items-center">
      <div className="text-xs text-muted-foreground">
        {t("loops.showing", "Showing {{from}}–{{to}} of {{total}}", {
          from: showFrom,
          to: showTo,
          total,
        })}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        disabled={disabled}
        siblingCount={1}
      />
    </div>
  );
}
