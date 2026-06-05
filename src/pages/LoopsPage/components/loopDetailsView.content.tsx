import { useTranslation } from "react-i18next";

import type { Loop, LoopStatus } from "src/entities/loop";
import { updateLoopViaRest, type LoopSourceStat } from "src/features/loops";
import type { VacancyMatch } from "src/features/vacancyMatches";

import { CardText } from "./Header";
import { LoopAnalyticsTab } from "./loopDetailsView.analyticsTab";
import { LoopHistoryTab } from "./loopDetailsView.historyTab";
import { LoopOverviewTab } from "./loopDetailsView.overviewTab";
import { LoopPreviewTab } from "./loopDetailsView.previewTab";
import { LoopSourcesTab } from "./loopDetailsView.sourcesTab";
import type { TabKey } from "./loopDetailsView.types";
import { LoopSettingsPanel } from "./LoopSettingsPanel";

export function LoopDetailContent({
  isLoadingLoop,
  loopError,
  loop,
  activeTab,
  matches,
  matchesLoading,
  sourceStats,
  sourceStatsLoading,
  onRefreshSourceStats,
  onMatchSaved,
  isArchived,
  status,
  onOpenMatches,
  onPauseResume,
  onArchive,
  onLoopUpdated,
}: {
  isLoadingLoop: boolean;
  loopError: string | null;
  loop: Loop | null;
  activeTab: TabKey;
  matches: VacancyMatch[];
  matchesLoading: boolean;
  sourceStats: LoopSourceStat[];
  sourceStatsLoading: boolean;
  onRefreshSourceStats: () => void;
  onMatchSaved: () => void;
  isArchived: boolean;
  status: LoopStatus;
  onOpenMatches?: (id: string) => void;
  onPauseResume: () => Promise<void>;
  onArchive: () => Promise<void>;
  onLoopUpdated: (loop: Loop) => void;
}) {
  const { t } = useTranslation();

  if (isLoadingLoop) return <CardText>{t("loops.loadingLoop", "Loading loop…")}</CardText>;
  if (loopError) return <CardText>{loopError}</CardText>;
  if (!loop) return <CardText>{t("loops.notFound", "Loop not found.")}</CardText>;

  if (activeTab === "settings") {
    return (
      <LoopSettingsPanel
        loop={loop}
        onSave={async (patch) => {
          const updated = await updateLoopViaRest(loop.id, patch);
          onLoopUpdated(updated);
          return updated;
        }}
        isPaused={status === "paused"}
        onPauseResume={isArchived ? undefined : onPauseResume}
        onArchive={isArchived ? undefined : onArchive}
      />
    );
  }
  if (activeTab === "sources")
    return (
      <LoopSourcesTab
        loop={loop}
        matches={matches}
        sourceStats={sourceStats}
        sourceStatsLoading={sourceStatsLoading}
        onRefreshSourceStats={onRefreshSourceStats}
        onLoopUpdated={onLoopUpdated}
      />
    );
  if (activeTab === "preview")
    return (
      <LoopPreviewTab
        loop={loop}
        onRefreshSourceStats={onRefreshSourceStats}
        onMatchSaved={onMatchSaved}
      />
    );
  if (activeTab === "history")   return <LoopHistoryTab loop={loop} />;
  if (activeTab === "analytics") return <LoopAnalyticsTab loop={loop} matches={matches} />;
  return (
    <LoopOverviewTab
      loop={loop}
      matches={matches}
      matchesLoading={matchesLoading}
      onOpenMatches={onOpenMatches}
      sourceStats={sourceStats}
      sourceStatsLoading={sourceStatsLoading}
    />
  );
}
