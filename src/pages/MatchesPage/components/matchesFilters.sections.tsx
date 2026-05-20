import type { ReactNode } from "react";

interface MatchesFiltersCardProps {
  children: ReactNode;
}

export function MatchesFiltersCard({ children }: MatchesFiltersCardProps) {
  return (
    <div className="shrink-0 border-b border-border bg-background px-7 py-3 space-y-3">
      {children}
    </div>
  );
}

export { MatchesFiltersControls } from "./matchesFilters.controls";
export { MatchesFiltersPagination } from "./matchesFilters.pagination";
export {
  FilterChip,
  MatchesFiltersSummaryRow,
  MatchesPageSummary,
} from "./matchesFilters.summary";
