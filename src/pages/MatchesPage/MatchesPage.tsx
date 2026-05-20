import { Filter, RefreshCw, Plus } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

import { MatchCard } from "src/entities/loopMatch";
import type { VacancyMatch } from "src/features/vacancyMatches";
import { getErrorMessage } from "src/shared/lib";
import { PageMessage } from "src/shared/ui";

import { EditMatchModal } from "./components/EditMatchModal";
import { MatchesDiscoveryPreviewPanel } from "./components/MatchesDiscoveryPreviewPanel";
import { MatchesFilters } from "./components/MatchesFilters";
import { MatchesSavedVacancyMatchesSection } from "./components/MatchesSavedVacancyMatchesSection";
import { getMatchesDiscoverySavedPreviewKey } from "./components/matchesDiscoveryPreview.helpers";
import { MATCHES_SAVED_MATCHES_COPY } from "./components/matchesSavedVacancyMatches.helpers";
import { useMatchesPageController } from "./model/useMatchesPageController";

function MatchesPageHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { t } = useTranslation();
  return (
    <div className="shrink-0 border-b border-border bg-background px-7 py-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11.5px] text-subtle-foreground mb-1">
            <span>Loopboard</span>
            <span>/</span>
            <span className="text-muted-foreground">{title}</span>
          </div>
          <h1 className="text-[22px] font-semibold tracking-[-0.025em] text-foreground leading-none">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <Filter className="h-3.5 w-3.5 text-subtle-foreground" />
            {t("matches.list.filters", "Filters")}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-foreground transition-colors hover:bg-muted"
          >
            <RefreshCw className="h-3.5 w-3.5 text-subtle-foreground" />
            {t("matches.list.refresh", "Refresh")}
          </button>
          <button
            type="button"
            className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-[12.5px] font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("matches.list.addManual", "Add manually")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { t } = useTranslation();
  const vm = useMatchesPageController();
  const { matchesQ, loopsQ } = vm.queries;
  const [savedMatchesReloadKey, setSavedMatchesReloadKey] = useState(0);
  const [savedPreviewKeys, setSavedPreviewKeys] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  function handleSavedMatchChanged() {
    setSavedMatchesReloadKey((value) => value + 1);
    void matchesQ.refetch();
  }

  const handleSavedItemsLoaded = useCallback((items: VacancyMatch[]) => {
    setSavedPreviewKeys(
      new Set(
        items.map((item) =>
          getMatchesDiscoverySavedPreviewKey({
            loopId: item.loopId,
            sourceId: item.source,
            externalId: item.externalId,
            sourceUrl: item.sourceUrl,
          }),
        ),
      ),
    );
  }, []);

  const title = t("matches.list.title", "Matches");
  const subtitle = t("matches.list.subtitle", "");

  if (matchesQ.isLoading) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <MatchesPageHeader title={title} subtitle={subtitle} />
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <PageMessage>{t("matches.common.loading")}</PageMessage>
        </div>
      </div>
    );
  }

  if (matchesQ.isError) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <MatchesPageHeader title={title} subtitle={subtitle} />
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <PageMessage>{getErrorMessage(matchesQ.error)}</PageMessage>
        </div>
      </div>
    );
  }

  if (vm.matches.length === 0) {
    return (
      <div className="flex h-full flex-col overflow-hidden">
        <MatchesPageHeader title={title} subtitle={subtitle} />
        <div className="flex-1 overflow-y-auto bg-background p-7">
          <MatchesDiscoveryPreviewPanel
            filters={vm.filters}
            loops={vm.loops}
            loopsLoading={loopsQ.isLoading}
            savedPreviewKeys={savedPreviewKeys}
            onMatchSaved={handleSavedMatchChanged}
          />
          <MatchesSavedVacancyMatchesSection
            loops={vm.loops}
            loopsLoading={loopsQ.isLoading}
            onItemsLoaded={handleSavedItemsLoaded}
            reloadKey={savedMatchesReloadKey}
            selectedLoopIds={vm.filters.loopIds}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <MatchesPageHeader title={title} subtitle={subtitle} />

      <MatchesFilters
        value={vm.filters}
        onChange={vm.setFilters}
        onReset={vm.onReset}
        loopOptions={vm.loops.map((l) => ({ id: l.id, name: l.name }))}
        platformOptions={vm.platformOptions}
        statusOptions={vm.statusOptions}
        totalCount={vm.matches.length}
        filteredCount={vm.visible.length}
        loopsLoading={loopsQ.isLoading}
        page={vm.pagination.page}
        totalPages={vm.pagination.totalPages}
        onPageChange={vm.pagination.setPage}
        pageFrom={vm.pagination.info.from}
        pageTo={vm.pagination.info.to}
        pageDisabled={vm.busy || matchesQ.isFetching}
      />

      <div className="flex-1 min-h-0 overflow-y-auto bg-background">
        <div className="p-7">
          <MatchesDiscoveryPreviewPanel
            filters={vm.filters}
            loops={vm.loops}
            loopsLoading={loopsQ.isLoading}
            savedPreviewKeys={savedPreviewKeys}
            onMatchSaved={handleSavedMatchChanged}
          />
          <MatchesSavedVacancyMatchesSection
            loops={vm.loops}
            loopsLoading={loopsQ.isLoading}
            onItemsLoaded={handleSavedItemsLoaded}
            reloadKey={savedMatchesReloadKey}
            selectedLoopIds={vm.filters.loopIds}
          />
          <div className="mb-3">
            <h2 className="text-[16px] font-semibold text-foreground">
              {MATCHES_SAVED_MATCHES_COPY.legacyApplicationsTitle}
            </h2>
            <p className="mt-1 text-[12.5px] text-muted-foreground">
              {MATCHES_SAVED_MATCHES_COPY.legacyApplicationsIntro}
            </p>
          </div>
          <div className="rounded-[14px] border border-border bg-card overflow-hidden">
            {vm.pagedMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                loopName={vm.loopIdToName.get(m.loopId) ?? ""}
                busy={vm.busy}
                onUpdateStatus={vm.actions.onUpdateStatus}
                onDelete={vm.actions.onDelete}
                onEdit={vm.openEdit}
              />
            ))}
          </div>
        </div>
      </div>

      <EditMatchModal
        open={Boolean(vm.editingMatch)}
        busy={vm.busy}
        loopName={vm.editingMatch ? (vm.loopIdToName.get(vm.editingMatch.loopId) ?? "") : ""}
        match={vm.editingMatch}
        onClose={vm.closeEdit}
        onSave={vm.actions.onSaveEdit}
      />
    </div>
  );
}
