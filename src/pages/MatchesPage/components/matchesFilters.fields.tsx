import { useTranslation } from "react-i18next";

import type { LoopMatchStatus } from "src/entities/loopMatch";
import {
  DebouncedInputField,
  MultiSelectDropdown,
  SelectField,
} from "src/shared/ui";

import type { MatchesFiltersState, MatchesSort } from "../model/filters";

import {
  buildMatchesSortOptions,
  labelStatus,
  type MatchesLoopOption,
  type MatchesSortOption,
} from "./matchesFilters.helpers";

interface MatchesSearchFieldProps {
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  value: string;
}

interface MatchesSortFieldProps {
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  value: MatchesSort;
}

interface MatchesLoopsFieldProps {
  clearLabel: string;
  loopOptions: MatchesLoopOption[];
  loopsLoading: boolean;
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  value: string[];
}

interface MatchesPlatformsFieldProps {
  clearLabel: string;
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  platformOptions: string[];
  value: string[];
}

interface MatchesStatusesFieldProps {
  clearLabel: string;
  onPatch: (patch: Partial<MatchesFiltersState>) => void;
  statusOptions: LoopMatchStatus[];
  value: LoopMatchStatus[];
}

export function MatchesSearchField({ onPatch, value }: MatchesSearchFieldProps) {
  const { t } = useTranslation();

  return (
    <DebouncedInputField
      label={t("matches.filters.search.label")}
      value={value}
      onValueChange={(q) => onPatch({ q })}
      delay={250}
      preset="search"
      inputSize="sm"
      autoComplete="off"
    />
  );
}

export function MatchesSortField({ onPatch, value }: MatchesSortFieldProps) {
  const { t } = useTranslation();
  const options = buildMatchesSortOptions(t) satisfies MatchesSortOption[];

  return (
    <SelectField
      label={t("matches.filters.sort.label")}
      value={value}
      onChange={(sort) => onPatch({ sort })}
      size="sm"
      options={options}
    />
  );
}

export function MatchesLoopsField({
  clearLabel,
  loopOptions,
  loopsLoading,
  onPatch,
  value,
}: MatchesLoopsFieldProps) {
  const { t } = useTranslation();

  return (
    <MultiSelectDropdown
      label={t("matches.filters.loops.label")}
      value={value}
      onChange={(loopIds) => onPatch({ loopIds })}
      options={loopOptions.map((loop) => ({ value: loop.id, label: loop.name }))}
      placeholder={
        loopsLoading
          ? t("matches.filters.loops.loading")
          : t("matches.filters.loops.all")
      }
      clearLabel={clearLabel}
      searchable
      disabled={loopsLoading}
    />
  );
}

export function MatchesPlatformsField({
  clearLabel,
  onPatch,
  platformOptions,
  value,
}: MatchesPlatformsFieldProps) {
  const { t } = useTranslation();

  return (
    <MultiSelectDropdown
      label={t("matches.filters.platforms.label")}
      value={value}
      onChange={(platforms) => onPatch({ platforms })}
      options={platformOptions.map((platform) => ({
        value: platform,
        label: platform.toUpperCase(),
      }))}
      placeholder={t("matches.filters.platforms.all")}
      clearLabel={clearLabel}
      searchable
    />
  );
}

export function MatchesStatusesField({
  clearLabel,
  onPatch,
  statusOptions,
  value,
}: MatchesStatusesFieldProps) {
  const { t } = useTranslation();

  return (
    <MultiSelectDropdown
      label={t("matches.filters.statuses.label")}
      value={value}
      onChange={(statuses) => onPatch({ statuses })}
      options={statusOptions.map((status) => ({
        value: status,
        label: labelStatus(t, status),
      }))}
      placeholder={t("matches.filters.statuses.all")}
      clearLabel={clearLabel}
    />
  );
}

export { FilterChip, MatchesPageSummary } from "./matchesFilters.summary";
