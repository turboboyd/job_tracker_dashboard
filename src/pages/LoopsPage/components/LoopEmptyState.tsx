import { useTranslation } from "react-i18next";

import type { LoopsTab } from "./loopListView.helpers";

export function LoopEmptyState({
  activeTab,
  onCreateLoop,
}: {
  activeTab: LoopsTab;
  onCreateLoop: () => void;
}) {
  const { t } = useTranslation();

  if (activeTab === "archive") {
    return (
      <div className="text-sm text-muted-foreground">
        {t("loops.emptyArchive", "Архивных циклов нет.")}
      </div>
    );
  }
  if (activeTab === "paused") {
    return (
      <div className="text-sm text-muted-foreground">
        {t("loops.emptyPaused", "Нет циклов на паузе.")}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center rounded-[14px] border border-dashed border-border bg-card py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-primary"
          aria-hidden="true"
        >
          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          <polyline points="21 3 21 9 15 9" />
        </svg>
      </div>
      <p className="mt-4 text-[15px] font-semibold text-foreground">
        {t("loops.emptyTitle", "No loops yet")}
      </p>
      <p className="mt-1.5 max-w-[280px] text-[13px] text-muted-foreground">
        {t("loops.emptyHint", "Create your first loop to start tracking job opportunities automatically.")}
      </p>
      <button
        type="button"
        onClick={onCreateLoop}
        className="mt-5 rounded-lg bg-primary px-5 py-2 text-[13px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        {t("loops.newLoop", "New loop")}
      </button>
    </div>
  );
}
