import { Pagination } from "src/shared/ui";

import { MatchesPageSummary } from "./matchesFilters.summary";

interface MatchesFiltersPaginationProps {
  filteredCount: number;
  onPageChange: (next: number | ((prev: number) => number)) => void;
  page: number;
  pageDisabled: boolean;
  pageFrom: number;
  pageTo: number;
  totalPages: number;
}

export function MatchesFiltersPagination({
  page,
  totalPages,
  onPageChange,
  pageDisabled,
  pageFrom,
  pageTo,
  filteredCount,
}: MatchesFiltersPaginationProps) {
  return (
    <div className="grid grid-cols-1 items-center gap-md md:grid-cols-12">
      <MatchesPageSummary filteredCount={filteredCount} pageFrom={pageFrom} pageTo={pageTo} />

      <div className="md:col-span-8 flex justify-start md:justify-end">
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={onPageChange}
          disabled={pageDisabled}
          siblingCount={1}
        />
      </div>
    </div>
  );
}
