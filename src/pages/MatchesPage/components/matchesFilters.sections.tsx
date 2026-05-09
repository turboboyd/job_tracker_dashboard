import type { ReactNode } from "react";

import { Card } from "src/shared/ui";

interface MatchesFiltersCardProps {
  children: ReactNode;
}

export function MatchesFiltersCard({ children }: MatchesFiltersCardProps) {
  return (
    <Card
      variant="default"
      padding="sm"
      shadow="sm"
      className="space-y-md overflow-visible"
    >
      {children}
    </Card>
  );
}

export { MatchesFiltersControls } from "./matchesFilters.controls";
export { MatchesFiltersPagination } from "./matchesFilters.pagination";
export {
  FilterChip,
  MatchesFiltersSummaryRow,
  MatchesPageSummary,
} from "./matchesFilters.summary";
