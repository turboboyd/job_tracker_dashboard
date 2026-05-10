import { Button } from "src/shared/ui/Button";
import { Input } from "src/shared/ui/Form/Input";

const NATIVE_SELECT_CLASS =
  "h-9 rounded-xl border border-input bg-input px-sm text-sm text-foreground shadow-sm";

export const PIPELINE_COPY = {
  addStage: "Add stage",
  addSubStatus: "Add sub-status",
  defaultStage: "Default stage:",
  defaultSubStatus: "Default sub-status:",
  delete: "Delete",
  deleteStage: "Delete stage",
  notesTitle: "Notes",
  reset: "Reset",
  resetToDefaults: "Reset to defaults",
  save: "Save",
  stageLabelPlaceholder: "Stage label",
  subStatusLabelPlaceholder: "Sub-status label",
  subtitle:
    "Configure pipeline stages and sub-statuses: naming, ordering, visibility, and defaults.",
  title: "Pipeline / Statuses",
  up: "Up",
  down: "Down",
  visible: "Visible",
  setDefault: "Set default",
} as const;

export const PIPELINE_NOTES = [
  "Order controls sorting in lists and boards. Use Up and Down to resequence stages and sub-statuses.",
  "Visibility only hides stages and statuses in the UI. Existing cards keep their saved values.",
  "Defaults are used when a stage changes and the app needs an initial sub-status.",
] as const;

export interface PipelineOption {
  label: string;
  value: string;
}

interface PipelineNativeSelectProps {
  disabled?: boolean;
  onChange: (value: string) => void;
  options: readonly PipelineOption[];
  value: string;
}

export function PipelineNativeSelect({
  disabled,
  onChange,
  options,
  value,
}: PipelineNativeSelectProps) {
  return (
    <select
      className={NATIVE_SELECT_CLASS}
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

interface PipelineLabelInputProps {
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}

export function PipelineLabelInput({
  className,
  disabled,
  onChange,
  placeholder,
  value,
}: PipelineLabelInputProps) {
  return (
    <Input
      preset="default"
      disabled={disabled}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={className}
      placeholder={placeholder}
    />
  );
}

interface PipelineVisibilityToggleProps {
  checked: boolean;
  disabled?: boolean;
  label?: string;
  onChange: (checked: boolean) => void;
}

export function PipelineVisibilityToggle({
  checked,
  disabled,
  label = PIPELINE_COPY.visible,
  onChange,
}: PipelineVisibilityToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  );
}

interface PipelineMoveButtonsProps {
  canMoveDown: boolean;
  canMoveUp: boolean;
  disabled?: boolean;
  onMoveDown: () => void;
  onMoveUp: () => void;
}

export function PipelineMoveButtons({
  canMoveDown,
  canMoveUp,
  disabled,
  onMoveDown,
  onMoveUp,
}: PipelineMoveButtonsProps) {
  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={onMoveUp}
        disabled={!canMoveUp || disabled}
      >
        {PIPELINE_COPY.up}
      </Button>
      <Button
        size="sm"
        variant="outline"
        onClick={onMoveDown}
        disabled={!canMoveDown || disabled}
      >
        {PIPELINE_COPY.down}
      </Button>
    </>
  );
}
