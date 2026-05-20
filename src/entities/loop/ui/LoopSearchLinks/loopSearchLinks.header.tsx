import type { TFunction } from "i18next";

import { Button } from "src/shared/ui/Button";

import {
  DesktopAppliedBadges,
  MobileAppliedBadges,
} from "./loopSearchLinks.badges";

interface HeaderProps {
  t: TFunction;
  info: { from: number; to: number };
  total: number;
  appliedBadges: string[];
  canEditSources: boolean;
  isSaving: boolean;
  userId: string | null;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  onOpenAdd: () => void;
}

export function LoopSearchHeader({
  t,
  info,
  total,
  appliedBadges,
  canEditSources,
  isSaving,
  userId,
  onOpenSettings,
  onOpenSources,
  onOpenAdd,
}: HeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 flex-col gap-1">
        <LoopSearchHeaderTitle t={t} info={info} total={total} />

        <p className="text-sm text-muted-foreground">
          {t(
            "loops.searchLinksSubtitle",
            "Apply filters → open platform → pick a job → paste URL → save match.",
          )}
        </p>

        <div className="mt-2">
          <MobileAppliedBadges badges={appliedBadges} t={t} />
          <DesktopAppliedBadges badges={appliedBadges} />
        </div>
      </div>

      <LoopSearchHeaderActions
        t={t}
        canEditSources={canEditSources}
        isSaving={isSaving}
        userId={userId}
        onOpenSettings={onOpenSettings}
        onOpenSources={onOpenSources}
        onOpenAdd={onOpenAdd}
      />
    </div>
  );
}

function LoopSearchHeaderTitle({
  t,
  info,
  total,
}: {
  t: TFunction;
  info: { from: number; to: number };
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <h3 className="text-base font-semibold text-foreground">
        {t("loops.searchLinksTitle", "Search links")}
      </h3>

      <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
        {t("loops.showing", "Showing {{from}}–{{to}} of {{total}}", {
          from: info.from,
          to: info.to,
          total,
        })}
      </span>
    </div>
  );
}

function LoopSearchHeaderActions({
  t,
  canEditSources,
  isSaving,
  userId,
  onOpenSettings,
  onOpenSources,
  onOpenAdd,
}: {
  t: TFunction;
  canEditSources: boolean;
  isSaving: boolean;
  userId: string | null;
  onOpenSettings: () => void;
  onOpenSources: () => void;
  onOpenAdd: () => void;
}) {
  return (
    <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
      <Button
        variant="outline"
        shape="lg"
        onClick={onOpenSettings}
        disabled={isSaving}
        className="w-full sm:w-auto"
      >
        {t("loops.myLoopSettings", "Настройки направления поиска")}
      </Button>

      <Button
        variant="outline"
        shape="lg"
        onClick={onOpenSources}
        disabled={!canEditSources}
        className="w-full sm:w-auto"
      >
        {t("loops.editSources", "Edit sources")}
      </Button>

      <Button
        variant="default"
        shape="lg"
        shadow="sm"
        onClick={onOpenAdd}
        disabled={!userId}
        className="w-full sm:w-auto"
      >
        {t("loops.addMatch", "Добавить вакансию")}
      </Button>
    </div>
  );
}
