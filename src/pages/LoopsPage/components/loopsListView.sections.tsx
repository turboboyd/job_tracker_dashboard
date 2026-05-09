import type { Loop } from "src/entities/loop";
import { getErrorMessage } from "src/shared/lib";
import { Button, PageHeader } from "src/shared/ui";

import {
  LoopsCardsList,
  LoopsListMessage,
  LoopsPaginationSummary,
} from "./loopsListView.content";
import type { LoopsListTranslate } from "./loopsListView.types";

interface LoopsListHeaderProps {
  onCreateClick: () => void;
  t: LoopsListTranslate;
}

interface LoopsListContentProps {
  error: unknown;
  isError: boolean;
  isFetching: boolean;
  isLoading: boolean;
  items: Loop[];
  onOpenLoop: (id: string) => void;
  onPageChange: (nextPage: number) => void;
  page: number;
  showFrom: number;
  showTo: number;
  t: LoopsListTranslate;
  total: number;
  totalPages: number;
}

export function LoopsListHeader({ onCreateClick, t }: LoopsListHeaderProps) {
  return (
    <PageHeader
      title={t("loops.listTitle", "My Loops")}
      subtitle={t("loops.listSubtitle", "Create a loop and track matches.")}
      right={
        <Button
          variant="default"
          shadow="sm"
          shape="lg"
          onClick={onCreateClick}
        >
          {t("loops.newLoop", "New loop")}
        </Button>
      }
    />
  );
}

export function LoopsListContent({
  items,
  total,
  page,
  totalPages,
  showFrom,
  showTo,
  isLoading,
  isFetching,
  isError,
  error,
  onOpenLoop,
  onPageChange,
  t,
}: LoopsListContentProps) {
  if (isLoading) {
    return <LoopsListMessage>{t("loops.loading", "Loading…")}</LoopsListMessage>;
  }

  if (isError) {
    return <LoopsListMessage>{getErrorMessage(error)}</LoopsListMessage>;
  }

  if (total === 0) {
    return (
      <LoopsListMessage>
        {t("loops.empty", "No loops yet. Create your first loop.")}
      </LoopsListMessage>
    );
  }

  return (
    <div className="space-y-4">
      <LoopsCardsList items={items} onOpenLoop={onOpenLoop} t={t} />

      <LoopsPaginationSummary
        page={page}
        totalPages={totalPages}
        total={total}
        showFrom={showFrom}
        showTo={showTo}
        disabled={isFetching}
        onPageChange={onPageChange}
        t={t}
      />
    </div>
  );
}
