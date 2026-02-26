import React from "react";

import type { StatusKey } from "src/entities/application/model/status";
import { StatusMenu } from "src/entities/application/ui/StatusKit";

type Props = {
  label: string;
  value: StatusKey;
  disabled: boolean;
  onChange: (next: StatusKey) => void;
  className?: string;
};

export function StatusSelect({ label, value, disabled, onChange, className }: Props) {
  return (
    <label className={"flex items-center justify-between gap-md text-sm " + (className ?? "")}>
      <span className="text-muted-foreground">{label}</span>
      <StatusMenu value={value} disabled={disabled} onChange={onChange} size="sm" />
    </label>
  );
}
