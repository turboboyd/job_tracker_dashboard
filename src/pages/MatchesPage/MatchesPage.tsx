import { useTranslation } from "react-i18next";

import { MatchCard } from "src/entities/loopMatch";
import { getErrorMessage } from "src/shared/lib";
import { PageHeader, PageMessage } from "src/shared/ui";

import { EditMatchModal } from "./components/EditMatchModal";
import { MatchesFilters } from "./components/MatchesFilters";
import { useMatchesPageController } from "./model/useMatchesPageController";

export default function MatchesPage() {
  const { t } = useTranslation();
  const vm = useMatchesPageController();
  const { matchesQ, loopsQ } = vm.queries;

  if (matchesQ.isLoading) {
    return (
      <div className="w-full h-full flex flex-col min-h-0">
        <PageHeader title={t("matches.list.title")} subtitle={t("matches.list.subtitle")} />
        <PageMessage>{t("matches.common.loading")}</PageMessage>
      </div>
    );
  }

  if (matchesQ.isError) {
    return (
      <div className="w-full h-full flex flex-col min-h-0">
        <PageHeader title={t("matches.list.title")} subtitle={t("matches.list.subtitle")} />
        <PageMessage>{getErrorMessage(matchesQ.error)}</PageMessage>
      </div>
    );
  }

  if (vm.matches.length === 0) {
    return (
      <div className="w-full h-full flex flex-col min-h-0">
        <PageHeader title={t("matches.list.title")} subtitle={t("matches.list.subtitle")} />
        <PageMessage>{t("matches.list.empty")}</PageMessage>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PageHeader
        title={t("matches.list.title")}
        subtitle={t("matches.list.subtitle")}
      />

      <>
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

        <div className="flex-1 min-h-0 overflow-auto pt-md">
          <div className="grid grid-cols-1 gap-md">
            {vm.pagedMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                loopName={vm.loopIdToName.get(m.loopId) ?? ""}
                busy={vm.busy}
                onUpdateStatus={vm.actions.onUpdateStatus}
                onDelete={vm.actions.onDelete}
                onEdit={vm.setEditingId}
              />
            ))}
          </div>
        </div>

        <EditMatchModal
          open={Boolean(vm.editingMatch)}
          busy={vm.busy}
          loopName={vm.editingMatch ? (vm.loopIdToName.get(vm.editingMatch.loopId) ?? "") : ""}
          match={vm.editingMatch}
          onClose={() => vm.setEditingId(null)}
          onSave={vm.actions.onSaveEdit}
        />
      </>
    </div>
  );
}
