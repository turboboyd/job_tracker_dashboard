import type { CanonicalFilters } from "../../model";

import {
  CompactSelectFilterField,
  CompactTextFilterField,
  ExcludeAgenciesField,
} from "./compactFilters.fields";
import type {
  CompactFiltersLabels,
  CompactFiltersSelectFieldConfig,
  CompactFiltersSelectOptions,
  CompactFiltersTextFieldConfig,
} from "./compactFilters.helpers";

interface AdvancedSelectFiltersRowProps {
  configs: CompactFiltersSelectFieldConfig[];
  disabled: boolean;
  onChange: (next: CanonicalFilters) => void;
  options: CompactFiltersSelectOptions;
  value: CanonicalFilters;
}

function AdvancedSelectFiltersRow({
  configs,
  disabled,
  onChange,
  options,
  value,
}: AdvancedSelectFiltersRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      {configs.map((config) => (
        <CompactSelectFilterField
          key={config.key}
          config={config}
          disabled={disabled}
          onChange={onChange}
          options={options}
          value={value}
        />
      ))}
    </div>
  );
}

interface AdvancedTextFiltersRowProps {
  configs: CompactFiltersTextFieldConfig[];
  disabled: boolean;
  onChange: (next: CanonicalFilters) => void;
  value: CanonicalFilters;
}

function AdvancedTextFiltersRow({
  configs,
  disabled,
  onChange,
  value,
}: AdvancedTextFiltersRowProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      {configs.map((config) => (
        <CompactTextFilterField
          key={config.key}
          config={config}
          disabled={disabled}
          onChange={onChange}
          value={value}
        />
      ))}
    </div>
  );
}

function AdvancedExtrasRow({
  disabled,
  labels,
  onChange,
  options,
  value,
}: {
  disabled: boolean;
  labels: CompactFiltersLabels;
  onChange: (next: CanonicalFilters) => void;
  options: CompactFiltersSelectOptions;
  value: CanonicalFilters;
}) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      <CompactSelectFilterField
        config={{
          colSpanClass: "md:col-span-3",
          key: "language",
          label: labels.languageTitle,
        }}
        disabled={disabled}
        onChange={onChange}
        options={options}
        value={value}
      />

      <ExcludeAgenciesField
        disabled={disabled}
        labels={labels}
        onChange={onChange}
        value={value}
      />

      <div className="md:col-span-5" />
    </div>
  );
}

interface AdvancedFiltersPanelProps {
  advancedSelectFieldConfigs: CompactFiltersSelectFieldConfig[];
  advancedTextFieldConfigs: CompactFiltersTextFieldConfig[];
  disabled: boolean;
  labels: CompactFiltersLabels;
  onChange: (next: CanonicalFilters) => void;
  selectOptions: CompactFiltersSelectOptions;
  value: CanonicalFilters;
}

export function AdvancedFiltersPanel({
  advancedSelectFieldConfigs,
  advancedTextFieldConfigs,
  disabled,
  labels,
  onChange,
  selectOptions,
  value,
}: AdvancedFiltersPanelProps) {
  return (
    <div className="rounded-2xl border border-border bg-background p-4 space-y-4">
      <AdvancedSelectFiltersRow
        configs={advancedSelectFieldConfigs}
        disabled={disabled}
        onChange={onChange}
        options={selectOptions}
        value={value}
      />

      <AdvancedTextFiltersRow
        configs={advancedTextFieldConfigs}
        disabled={disabled}
        onChange={onChange}
        value={value}
      />

      <AdvancedExtrasRow
        disabled={disabled}
        labels={labels}
        onChange={onChange}
        options={selectOptions}
        value={value}
      />

      <div className="text-xs text-muted-foreground">{labels.advancedInfo}</div>
    </div>
  );
}

