import { useTranslation } from "react-i18next";

import type { LoopMatchStatus } from "src/entities/loopMatch";

import type { MatchesFiltersState } from "../model/filters";

import {
  MatchesLoopsField,
  MatchesPlatformsField,
  MatchesSearchField,
  MatchesSortField,
  MatchesStatusesField,
} from "./matchesFilters.fields";
import type { MatchesLoopOption } from "./matchesFilters.helpers";

interface MatchesFiltersControlsProps {
  loopOptions: MatchesLoopOption[];
  loopsLoading: boolean;
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  platformOptions: string[];
  statusOptions: LoopMatchStatus[];
  value: MatchesFiltersState;
}

export function MatchesFiltersControls({
  value,
  onPatch,
  loopOptions,
  platformOptions,
  statusOptions,
  loopsLoading,
}: MatchesFiltersControlsProps) {
  const { t } = useTranslation();
  const clearLabel = String(t("matches.filters.common.clear"));

  return (
    <div className="grid grid-cols-1 gap-md md:grid-cols-12">
      <div className="md:col-span-6 lg:col-span-2">
        <MatchesSearchField value={value.q} onPatch={onPatch} />
      </div>

      <div className="md:col-span-6 lg:col-span-2">
        <MatchesSortField value={value.sort} onPatch={onPatch} />
      </div>

      <div className="md:col-span-6 lg:col-span-2">
        <MatchesLoopsField
          clearLabel={clearLabel}
          loopOptions={loopOptions}
          loopsLoading={loopsLoading}
          onPatch={onPatch}
          value={value.loopIds}
        />
      </div>

      <div className="md:col-span-6 lg:col-span-2">
        <MatchesPlatformsField
          clearLabel={clearLabel}
          onPatch={onPatch}
          platformOptions={platformOptions}
          value={value.platforms}
        />
      </div>

      <div className="md:col-span-6 lg:col-span-2">
        <MatchesStatusesField
          clearLabel={clearLabel}
          onPatch={onPatch}
          statusOptions={statusOptions}
          value={value.statuses}
        />
      </div>
    </div>
  );
}
