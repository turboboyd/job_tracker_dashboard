import { Button } from "src/shared/ui/Button";

import type { CanonicalFilters } from "../../model";

import {
  CompactSelectFilterField,
  CompactTextFilterField,
} from "./compactFilters.fields";
import type {
  CompactFiltersLabels,
  CompactFiltersSelectFieldConfig,
  CompactFiltersSelectOptions,
  CompactFiltersTextFieldConfig,
} from "./compactFilters.helpers";

function AdvancedToggleButton({
  advancedOpen,
  disabled,
  labels,
  onToggle,
}: {
  advancedOpen: boolean;
  disabled: boolean;
  labels: CompactFiltersLabels;
  onToggle: () => void;
}) {
  return (
    <div className="md:col-span-1">
      <div className="grid gap-1.5">
        <div className="h-5" aria-hidden />
        <Button
          variant="outline"
          shape="lg"
          className="w-full"
          onClick={onToggle}
          disabled={disabled}
        >
          {advancedOpen ? labels.less : labels.more}
        </Button>
      </div>
    </div>
  );
}

interface CoreFiltersGridProps {
  advancedOpen: boolean;
  coreSelectFieldConfigs: CompactFiltersSelectFieldConfig[];
  coreTextFieldConfigs: CompactFiltersTextFieldConfig[];
  disabled: boolean;
  labels: CompactFiltersLabels;
  onChange: (next: CanonicalFilters) => void;
  onToggleAdvanced: () => void;
  selectOptions: CompactFiltersSelectOptions;
  value: CanonicalFilters;
}

export function CoreFiltersGrid({
  advancedOpen,
  coreSelectFieldConfigs,
  coreTextFieldConfigs,
  disabled,
  labels,
  onChange,
  onToggleAdvanced,
  selectOptions,
  value,
}: CoreFiltersGridProps) {
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-12">
      {coreTextFieldConfigs.map((config) => (
        <CompactTextFilterField
          key={config.key}
          config={config}
          disabled={disabled}
          onChange={onChange}
          value={value}
        />
      ))}

      {coreSelectFieldConfigs.map((config) => (
        <CompactSelectFilterField
          key={config.key}
          config={config}
          disabled={disabled}
          onChange={onChange}
          options={selectOptions}
          value={value}
        />
      ))}

      <AdvancedToggleButton
        advancedOpen={advancedOpen}
        disabled={disabled}
        labels={labels}
        onToggle={onToggleAdvanced}
      />
    </div>
  );
}

