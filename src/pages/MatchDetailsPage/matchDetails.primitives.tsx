import { StatusBadge, StatusMenu } from "src/entities/application";
import type { LoopMatchStatus } from "src/entities/loopMatch";

export const EMPTY_VALUE = "-";

export function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-md">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground text-right break-words">{value}</dd>
    </div>
  );
}

export function StatusSelect({
  value,
  disabled,
  label,
  onChange,
}: {
  value: LoopMatchStatus;
  disabled: boolean;
  label: string;
  onChange: (next: LoopMatchStatus) => void;
}) {
  return (
    <label className="flex items-center justify-between gap-md text-sm">
      <span className="text-muted-foreground">{label}</span>
      <StatusMenu
        value={value}
        disabled={disabled}
        onChange={(status) => onChange(status)}
        size="sm"
      />
    </label>
  );
}

export function StatusPill({ status }: { status: LoopMatchStatus }) {
  return <StatusBadge status={status} />;
}

