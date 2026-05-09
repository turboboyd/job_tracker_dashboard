import { FormField, Input } from "src/shared/ui";

import type { CanonicalFilters } from "../../model";

import {
  getSelectClassName,
  normalizeTextFilterValue,
  parseSelectFilterValue,
  updateFilter,
  type CompactFiltersLabels,
  type CompactFiltersSelectFieldConfig,
  type CompactFiltersSelectOptions,
  type CompactFiltersTextFieldConfig,
  type Option,
} from "./compactFilters.helpers";

interface FilterSelectProps<T extends string | number> {
  disabled: boolean;
  label: string;
  onChange: (rawValue: string) => void;
  options: Option<T>[];
  surface?: "input" | "card";
  value: T;
}

export function CompactFilterSelect<T extends string | number>({
  disabled,
  label,
  onChange,
  options,
  surface = "card",
  value,
}: FilterSelectProps<T>) {
  return (
    <FormField label={label}>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={getSelectClassName(surface)}
        disabled={disabled}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </FormField>
  );
}

interface CompactTextFilterFieldProps {
  config: CompactFiltersTextFieldConfig;
  disabled: boolean;
  onChange: (next: CanonicalFilters) => void;
  value: CanonicalFilters;
}

export function CompactTextFilterField({
  config,
  disabled,
  onChange,
  value,
}: CompactTextFilterFieldProps) {
  return (
    <div className={config.colSpanClass}>
      <FormField
        label={config.label}
        {...(config.hint ? { hint: config.hint } : {})}
      >
        <Input
          value={value[config.key]}
          onChange={(event) =>
            updateFilter(
              value,
              onChange,
              config.key,
              normalizeTextFilterValue(config.key, event.target.value),
            )
          }
          placeholder={config.placeholder}
          disabled={disabled}
        />
      </FormField>
    </div>
  );
}

interface CompactSelectFilterFieldProps {
  config: CompactFiltersSelectFieldConfig;
  disabled: boolean;
  onChange: (next: CanonicalFilters) => void;
  options: CompactFiltersSelectOptions;
  value: CanonicalFilters;
}

export function CompactSelectFilterField({
  config,
  disabled,
  onChange,
  options,
  value,
}: CompactSelectFilterFieldProps) {
  const fieldKey = config.key;

  return (
    <div className={config.colSpanClass}>
      <CompactFilterSelect
        label={config.label}
        value={value[fieldKey]}
        options={options[fieldKey] as Option<string | number>[]}
        onChange={(rawValue) =>
          updateFilter(
            value,
            onChange,
            fieldKey,
            parseSelectFilterValue(fieldKey, rawValue),
          )
        }
        disabled={disabled}
        surface={config.surface ?? "card"}
      />
    </div>
  );
}

interface ExcludeAgenciesFieldProps {
  disabled: boolean;
  labels: CompactFiltersLabels;
  onChange: (next: CanonicalFilters) => void;
  value: CanonicalFilters;
}

export function ExcludeAgenciesField({
  disabled,
  labels,
  onChange,
  value,
}: ExcludeAgenciesFieldProps) {
  return (
    <div className="md:col-span-4 flex items-end">
      <label className="flex items-center gap-2 text-sm text-foreground">
        <input
          type="checkbox"
          checked={value.excludeAgencies}
          onChange={(event) =>
            updateFilter(value, onChange, "excludeAgencies", event.target.checked)
          }
          disabled={disabled}
        />
        {labels.excludeAgencies}
      </label>
    </div>
  );
}
