import React from "react";

import type { LoopMatchStatus } from "src/entities/loopMatch";

import type { MatchesFiltersState } from "../model/filters";

import { isDefaultMatchesFilters, type MatchesLoopOption } from "./matchesFilters.helpers";
import {
  MatchesFiltersCard,
  MatchesFiltersControls,
  MatchesFiltersPagination,
  MatchesFiltersSummaryRow,
} from "./matchesFilters.sections";

export function MatchesFilters({
  value,
  onChange,
  onReset,
  loopOptions,
  platformOptions,
  statusOptions,
  totalCount,
  filteredCount,
  loopsLoading,
  page,
  totalPages,
  onPageChange,
  pageFrom,
  pageTo,
  pageDisabled,
}: {
  value: MatchesFiltersState;
  onChange: (next: MatchesFiltersState) => void;
  onReset: () => void;
  loopOptions: MatchesLoopOption[];
  platformOptions: string[];
  statusOptions: LoopMatchStatus[];
  totalCount: number;
  filteredCount: number;
  loopsLoading: boolean;
  page: number;
  totalPages: number;
  onPageChange: (next: number | ((prev: number) => number)) => void;
  pageFrom: number;
  pageTo: number;
  pageDisabled: boolean;
}) {
  const patchFilters = React.useCallback(
    (patch: Partial<MatchesFiltersState>) => {
      onChange({ ...value, ...patch });
    },
    [onChange, value],
  );

  const isDefault = React.useMemo(() => isDefaultMatchesFilters(value), [value]);

  return (
    <MatchesFiltersCard>
      <MatchesFiltersSummaryRow
        filteredCount={filteredCount}
        totalCount={totalCount}
        filters={value}
        loopOptions={loopOptions}
        onRemoveChip={patchFilters}
        onReset={onReset}
        isDefault={isDefault}
      />

      <MatchesFiltersControls
        value={value}
        onPatch={patchFilters}
        loopOptions={loopOptions}
        platformOptions={platformOptions}
        statusOptions={statusOptions}
        loopsLoading={loopsLoading}
      />

      <MatchesFiltersPagination
        page={page}
        totalPages={totalPages}
        onPageChange={onPageChange}
        pageDisabled={pageDisabled}
        pageFrom={pageFrom}
        pageTo={pageTo}
        filteredCount={filteredCount}
      />
    </MatchesFiltersCard>
  );
}
