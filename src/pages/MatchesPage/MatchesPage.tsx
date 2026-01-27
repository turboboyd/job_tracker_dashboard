import { MatchCard } from "src/entities/match/ui/matchCard/MatchCard";
import { normalizeError } from "src/shared/lib";
import { Pagination, PageHeader, PageMessage } from "src/shared/ui";

import { EditMatchModal } from "./components/EditMatchModal";
import { MatchesFilters } from "./components/MatchesFilters";
import { useMatchesPageController } from "./model/useMatchesPageController";

export default function MatchesPage() {
  const vm = useMatchesPageController();
  const { matchesQ, loopsQ } = vm.queries;

  return (
    <div className="mx-auto">
      <PageHeader
        title="Matches"
        subtitle="All matches across all your loops."
      />

      {matchesQ.isLoading ? (
        <PageMessage>Loading matches…</PageMessage>
      ) : matchesQ.isError ? (
        <PageMessage>{normalizeError(matchesQ.error)}</PageMessage>
      ) : vm.matches.length === 0 ? (
        <PageMessage>No matches yet.</PageMessage>
      ) : (
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
          />

          <div className="grid grid-cols-1 gap-md">
            {vm.pagedMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                loopName={vm.loopIdToName.get(m.loopId) ?? ""}
                busy={vm.busy}
                onUpdateStatus={vm.actions.onUpdateStatus}
                onDelete={vm.actions.onDelete}
              />
            ))}
          </div>

          <div className="flex justify-center pt-md">
            <Pagination
              page={vm.pagination.page}
              totalPages={vm.pagination.totalPages}
              onPageChange={vm.pagination.setPage}
              disabled={vm.busy}
            />
          </div>

          <EditMatchModal
            open={Boolean(vm.editingMatch)}
            busy={vm.busy}
            loopName={
              vm.editingMatch
                ? vm.loopIdToName.get(vm.editingMatch.loopId) ?? ""
                : ""
            }
            match={vm.editingMatch}
            onClose={() => vm.setEditingId(null)}
            onSave={vm.actions.onSaveEdit}
          />
        </>
      )}
    </div>
  );
}
