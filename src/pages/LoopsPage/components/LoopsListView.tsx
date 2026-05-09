import { useTranslation } from "react-i18next";

import { CreateLoopModal } from "src/entities/loop";

import {
  LoopsListContent,
  LoopsListHeader,
} from "./loopsListView.sections";
import { useLoopsListController } from "./useLoopsListController";

interface LoopsListViewProps {
  userId: string;
  onOpenLoop: (id: string) => void;
}

export function LoopsListView({ userId, onOpenLoop }: LoopsListViewProps) {
  const { t } = useTranslation();
  const {
    createOpen,
    setCreateOpen,
    page,
    items,
    total,
    totalPages,
    showFrom,
    showTo,
    loopsPageQuery,
    goToPage,
    handleLoopCreated,
  } = useLoopsListController({ userId, onOpenLoop });

  return (
    <div className="space-y-6">
      <LoopsListHeader
        onCreateClick={() => setCreateOpen(true)}
        t={t}
      />

      <div className="rounded-2xl border border-border bg-card p-6">
        <LoopsListContent
          items={items}
          total={total}
          page={page}
          totalPages={totalPages}
          showFrom={showFrom}
          showTo={showTo}
          isLoading={loopsPageQuery.isLoading}
          isFetching={loopsPageQuery.isFetching}
          isError={loopsPageQuery.isError}
          error={loopsPageQuery.error}
          onOpenLoop={onOpenLoop}
          onPageChange={goToPage}
          t={t}
        />
      </div>

      <CreateLoopModal
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={handleLoopCreated}
      />
    </div>
  );
}
