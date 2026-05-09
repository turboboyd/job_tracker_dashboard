import type { ReactNode } from "react";

import { MatchCard } from "src/entities/loopMatch";
import type { LoopMatch, LoopMatchStatus, UpdateMatchInput } from "src/entities/loopMatch";
import { PageHeader, PageMessage } from "src/shared/ui";

import { EditMatchModal } from "./components/EditMatchModal";
import { MatchesFilters } from "./components/MatchesFilters";
import type { MatchesLoopOption } from "./components/matchesFilters.helpers";
import type { MatchesPageCardItem } from "./matchesPage.helpers";
import type { MatchesFiltersState } from "./model/filters";

interface MatchesPageShellProps {
  children: ReactNode;
  subtitle: string;
  title: string;
}

export function MatchesPageShell({
  children,
  subtitle,
  title,
}: MatchesPageShellProps) {
  return (
    <div className="w-full h-full flex flex-col min-h-0">
      <PageHeader title={title} subtitle={subtitle} />
      {children}
    </div>
  );
}

interface MatchesPageMessageProps {
  message: string;
}

export function MatchesPageMessage({ message }: MatchesPageMessageProps) {
  return <PageMessage>{message}</PageMessage>;
}

interface MatchesPageContentProps {
  busy: boolean;
  editingLoopName: string;
  editingMatch: LoopMatch | null;
  filteredCount: number;
  items: MatchesPageCardItem<LoopMatch>[];
  loopOptions: MatchesLoopOption[];
  loopsLoading: boolean;
  matchesCount: number;
  page: number;
  pageDisabled: boolean;
  pageFrom: number;
  pageTo: number;
  platformOptions: string[];
  statusOptions: LoopMatchStatus[];
  totalPages: number;
  value: MatchesFiltersState;
  onChange: (next: MatchesFiltersState) => void;
  onCloseEdit: () => void;
  onDelete: (matchId: string) => Promise<void>;
  onEdit: (matchId: string) => void;
  onPageChange: (next: number | ((prev: number) => number)) => void;
  onReset: () => void;
  onSaveEdit: (matchId: string, patch: UpdateMatchInput["patch"]) => Promise<void>;
  onUpdateStatus: (matchId: string, status: LoopMatchStatus) => Promise<void>;
}

export function MatchesPageContent({
  busy,
  editingLoopName,
  editingMatch,
  filteredCount,
  items,
  loopOptions,
  loopsLoading,
  matchesCount,
  page,
  pageDisabled,
  pageFrom,
  pageTo,
  platformOptions,
  statusOptions,
  totalPages,
  value,
  onChange,
  onCloseEdit,
  onDelete,
  onEdit,
  onPageChange,
  onReset,
  onSaveEdit,
  onUpdateStatus,
}: MatchesPageContentProps) {
  return (
    <>
      <MatchesFilters
        value={value}
        onChange={onChange}
        onReset={onReset}
        loopOptions={loopOptions}
        platformOptions={platformOptions}
        statusOptions={statusOptions}
        totalCount={matchesCount}
        filteredCount={filteredCount}
        loopsLoading={loopsLoading}
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageFrom={pageFrom}
        pageTo={pageTo}
        pageDisabled={pageDisabled}
      />

      <div className="flex-1 min-h-0 overflow-auto pt-md">
        <div className="grid grid-cols-1 gap-md">
          {items.map(({ loopName, match }) => (
            <MatchCard
              key={match.id}
              match={match}
              loopName={loopName}
              busy={busy}
              onUpdateStatus={(matchId, status) => {
                void onUpdateStatus(matchId, status);
              }}
              onDelete={(matchId) => {
                void onDelete(matchId);
              }}
              onEdit={onEdit}
            />
          ))}
        </div>
      </div>

      <EditMatchModal
        open={Boolean(editingMatch)}
        busy={busy}
        loopName={editingLoopName}
        match={editingMatch}
        onClose={onCloseEdit}
        onSave={onSaveEdit}
      />
    </>
  );
}
