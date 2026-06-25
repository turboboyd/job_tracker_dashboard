import { useTranslation } from "react-i18next";

import { Button } from "src/shared/ui";

import type { LoopsTab } from "./loopListView.helpers";

function TabButton({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: string;
  onClick: () => void;
}) {
  const activeClass = active
    ? "bg-background text-foreground shadow-sm"
    : "text-muted-foreground hover:text-foreground";

  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-md px-3 py-1.5 text-[12.5px] font-medium transition-colors",
        activeClass,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function LoopListToolbar({
  activeTab,
  onTabChange,
  onNewLoop,
}: {
  activeTab: LoopsTab;
  onTabChange: (tab: LoopsTab) => void;
  onNewLoop: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="shrink-0 border-b border-border bg-background px-7 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-[11.5px] text-subtle-foreground">
            <span>Loopboard</span>
            <span>/</span>
            <span className="text-muted-foreground">
              {t("loops.listTitle", "Loops")}
            </span>
          </div>
          <h1 className="text-[22px] font-semibold leading-none tracking-[-0.025em] text-foreground">
            {t("loops.listTitle", "Loops")}
          </h1>
          <p className="mt-1 text-[13px] text-muted-foreground">
            {t("loops.listSubtitle", "Create a loop and track matches.")}
          </p>
        </div>
        <Button
          variant="default"
          shadow="sm"
          shape="lg"
          onClick={onNewLoop}
        >
          {t("loops.newLoop", "New loop")}
        </Button>
      </div>

      <div className="mt-4 flex w-fit items-center gap-1 rounded-lg bg-muted/50 p-1">
        <TabButton active={activeTab === "active"} onClick={() => onTabChange("active")}>
          {t("loops.tabActive", "Активные")}
        </TabButton>
        <TabButton active={activeTab === "paused"} onClick={() => onTabChange("paused")}>
          {t("loops.tabPaused", "На паузе")}
        </TabButton>
        <TabButton active={activeTab === "archive"} onClick={() => onTabChange("archive")}>
          {t("loops.tabArchive", "Архив")}
        </TabButton>
      </div>
    </div>
  );
}
