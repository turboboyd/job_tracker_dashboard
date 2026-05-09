import { useTranslation } from "react-i18next";

import {
  buildMatchesPageLabels,
  buildMatchesPageState,
} from "./matchesPage.helpers";
import {
  MatchesPageContent,
  MatchesPageMessage,
  MatchesPageShell,
} from "./MatchesPage.sections";
import { useMatchesPageController } from "./model/useMatchesPageController";

export default function MatchesPage() {
  const { t } = useTranslation();
  const vm = useMatchesPageController();
  const labels = buildMatchesPageLabels(t);
  const state = buildMatchesPageState({
    error: vm.queries.matchesQ.error,
    isError: vm.queries.matchesQ.isError,
    isLoading: vm.queries.matchesQ.isLoading,
    labels,
    matchesCount: vm.matchesCount,
  });

  if (state.kind !== "ready") {
    return (
      <MatchesPageShell title={labels.title} subtitle={labels.subtitle}>
        <MatchesPageMessage message={state.message ?? labels.loading} />
      </MatchesPageShell>
    );
  }

  return (
    <MatchesPageShell title={labels.title} subtitle={labels.subtitle}>
      <MatchesPageContent
        busy={vm.busy}
        editingLoopName={vm.editingLoopName}
        editingMatch={vm.editingMatch}
        filteredCount={vm.visibleCount}
        items={vm.pagedMatchItems}
        loopOptions={vm.loopOptions}
        loopsLoading={vm.queries.loopsQ.isLoading}
        matchesCount={vm.matchesCount}
        page={vm.pagination.page}
        pageDisabled={vm.pageDisabled}
        pageFrom={vm.pagination.info.from}
        pageTo={vm.pagination.info.to}
        platformOptions={vm.platformOptions}
        statusOptions={vm.statusOptions}
        totalPages={vm.pagination.totalPages}
        value={vm.filters}
        onChange={vm.setFilters}
        onCloseEdit={vm.closeEdit}
        onDelete={vm.actions.onDelete}
        onEdit={vm.openEdit}
        onPageChange={vm.pagination.setPage}
        onReset={vm.onReset}
        onSaveEdit={vm.actions.onSaveEdit}
        onUpdateStatus={vm.actions.onUpdateStatus}
      />
    </MatchesPageShell>
  );
}
