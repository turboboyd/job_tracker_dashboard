import { Button } from "src/shared/ui/Button";
import { Modal } from "src/shared/ui/Modal";

import type { DashboardTrendsCardViewModel } from "./useDashboardTrendsCardController";

type CustomRangeModalProps = Pick<
  DashboardTrendsCardViewModel,
  | "draftFrom"
  | "draftTo"
  | "labels"
  | "onApplyCustom"
  | "onCustomOpenChange"
  | "onDraftFromChange"
  | "onDraftToChange"
  | "customOpen"
>;

interface DateFieldProps {
  label: string;
  onChange: (value: string) => void;
  value: string;
}

interface CustomRangeFieldsProps {
  draftFrom: string;
  draftTo: string;
  fromLabel: string;
  onDraftFromChange: (value: string) => void;
  onDraftToChange: (value: string) => void;
  toLabel: string;
}

interface CustomRangeActionsProps {
  applyLabel: string;
  cancelLabel: string;
  onApply: () => void;
  onClose: () => void;
}

function DateField({ label, onChange, value }: DateFieldProps) {
  return (
    <label className="space-y-1 text-sm">
      <div className="text-xs text-muted-foreground">{label}</div>
      <input
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground"
      />
    </label>
  );
}

function CustomRangeFields({
  draftFrom,
  draftTo,
  fromLabel,
  onDraftFromChange,
  onDraftToChange,
  toLabel,
}: CustomRangeFieldsProps) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <DateField
        label={fromLabel}
        value={draftFrom}
        onChange={onDraftFromChange}
      />
      <DateField
        label={toLabel}
        value={draftTo}
        onChange={onDraftToChange}
      />
    </div>
  );
}

function CustomRangeActions({
  applyLabel,
  cancelLabel,
  onApply,
  onClose,
}: CustomRangeActionsProps) {
  return (
    <div className="flex justify-end gap-2">
      <Button variant="outline" onClick={onClose}>
        {cancelLabel}
      </Button>
      <Button onClick={onApply}>{applyLabel}</Button>
    </div>
  );
}

export function CustomRangeModal({
  draftFrom,
  draftTo,
  labels,
  onApplyCustom,
  onDraftFromChange,
  onDraftToChange,
  onCustomOpenChange,
  customOpen,
}: CustomRangeModalProps) {
  return (
    <Modal
      open={customOpen}
      onOpenChange={onCustomOpenChange}
      title={labels.customTitle}
    >
      <div className="space-y-4">
        <CustomRangeFields
          draftFrom={draftFrom}
          draftTo={draftTo}
          fromLabel={labels.from}
          onDraftFromChange={onDraftFromChange}
          onDraftToChange={onDraftToChange}
          toLabel={labels.to}
        />
        <CustomRangeActions
          applyLabel={labels.apply}
          cancelLabel={labels.cancel}
          onApply={onApplyCustom}
          onClose={() => onCustomOpenChange(false)}
        />
      </div>
    </Modal>
  );
}
