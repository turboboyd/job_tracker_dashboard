import React, { useMemo } from "react";

import { STATUS_KEYS, statusesForStage, type Stage, type StatusKey } from "../../model/status";

import { StatusLabel } from "./StatusLabel";

function clsx(...xs: (string | false | null | undefined)[]) {
  return xs.filter(Boolean).join(" ");
}

export interface StatusMenuProps {
  value: StatusKey;
  onChange: (next: StatusKey) => void;
  disabled?: boolean;
  stage?: Stage;
  options?: readonly StatusKey[];
  className?: string;
  size?: "sm" | "md";
}

const SIZE_CLASS: Record<NonNullable<StatusMenuProps["size"]>, string> = {
  sm: "h-9 px-sm text-sm",
  md: "h-10 px-md text-sm",
};

export function StatusMenu({
  value,
  onChange,
  disabled = false,
  stage,
  options,
  className,
  size = "sm",
}: StatusMenuProps) {
  const items = useMemo<readonly StatusKey[]>(() => {
    if (options?.length) return options;
    if (stage) return statusesForStage(stage).map((m) => m.key);
    return STATUS_KEYS;
  }, [options, stage]);

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as StatusKey)}
      className={clsx(
        "rounded-full border border-border bg-card text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        SIZE_CLASS[size],
        className,
      )}
    >
      {items.map((k) => (
        <option key={k} value={k}>
          <StatusLabel status={k} />
        </option>
      ))}
    </select>
  );
}
