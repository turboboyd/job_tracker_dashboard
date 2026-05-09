import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type { CanonicalFilters } from "../../model";

import {
  buildAdvancedSelectFieldConfigs,
  buildAdvancedTextFieldConfigs,
  buildCompactFiltersLabels,
  buildCompactFiltersSelectOptions,
  buildCoreSelectFieldConfigs,
  buildCoreTextFieldConfigs,
  buildFilterBadges,
} from "./compactFilters.helpers";
import {
  AdvancedFiltersPanel,
  CoreFiltersGrid,
  FiltersHeader,
} from "./compactFilters.sections";

interface Props {
  value: CanonicalFilters;
  onChange: (next: CanonicalFilters) => void;
  onApply: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function CompactFilters({
  value,
  onChange,
  onApply,
  onReset,
  disabled,
}: Props) {
  const { t } = useTranslation();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const isDisabled = disabled === true;

  const labels = useMemo(() => buildCompactFiltersLabels(t), [t]);
  const selectOptions = useMemo(() => buildCompactFiltersSelectOptions(t), [t]);
  const coreTextFieldConfigs = useMemo(
    () => buildCoreTextFieldConfigs(labels),
    [labels],
  );
  const advancedTextFieldConfigs = useMemo(
    () => buildAdvancedTextFieldConfigs(labels),
    [labels],
  );
  const coreSelectFieldConfigs = useMemo(
    () => buildCoreSelectFieldConfigs(labels),
    [labels],
  );
  const advancedSelectFieldConfigs = useMemo(
    () => buildAdvancedSelectFieldConfigs(labels),
    [labels],
  );
  const badges = useMemo(() => buildFilterBadges(t, value), [t, value]);

  return (
    <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
      <FiltersHeader
        badges={badges}
        disabled={isDisabled}
        labels={labels}
        onApply={onApply}
        onReset={onReset}
      />

      <CoreFiltersGrid
        value={value}
        advancedOpen={advancedOpen}
        coreSelectFieldConfigs={coreSelectFieldConfigs}
        coreTextFieldConfigs={coreTextFieldConfigs}
        disabled={isDisabled}
        labels={labels}
        onChange={onChange}
        onToggleAdvanced={() => setAdvancedOpen((open) => !open)}
        selectOptions={selectOptions}
      />

      {advancedOpen ? (
        <AdvancedFiltersPanel
          value={value}
          advancedSelectFieldConfigs={advancedSelectFieldConfigs}
          advancedTextFieldConfigs={advancedTextFieldConfigs}
          disabled={isDisabled}
          labels={labels}
          onChange={onChange}
          selectOptions={selectOptions}
        />
      ) : null}
    </div>
  );
}
