import React from "react";

import { classNames } from "src/shared/lib";

export type ChipOption<T extends string> = {
  value: T;
  label: React.ReactNode;
  disabled?: boolean;
};

export type MultiSelectChipsProps<T extends string> = {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  value: T[];
  onChange: (next: T[]) => void;
  options: Array<ChipOption<T>>;
  allowClear?: boolean;
  clearLabel?: React.ReactNode;
  maxSelected?: number;

  className?: string;
};

function hasNode(v: React.ReactNode) {
  return v !== null && v !== undefined && v !== false && v !== "";
}

function toggle<T extends string>(arr: T[], v: T): T[] {
  return arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
}

export function MultiSelectChips<T extends string>({
  label,
  hint,
  error,
  value,
  onChange,
  options,
  allowClear = true,
  clearLabel = "All",
  maxSelected,
  className,
}: MultiSelectChipsProps<T>) {
  const id = React.useId();
  const message = error ?? hint;
  const describedBy = hasNode(message) ? `${id}__message` : undefined;
  const invalid = Boolean(error);

  const canAddMore = (next: T[]) =>
    typeof maxSelected !== "number" ? true : next.length <= maxSelected;

  return (
    <div className={classNames("grid gap-1.5", className)}>
      {label ? (
        <div className="text-sm font-medium text-foreground">{label}</div>
      ) : null}

      <div
        role="group"
        aria-describedby={describedBy}
        aria-invalid={invalid ? true : undefined}
        className="flex flex-wrap gap-2"
      >
        {allowClear ? (
          <button
            type="button"
            onClick={() => onChange([])}
            className={classNames(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm transition-colors",
              value.length === 0
                ? "border-ring bg-background text-foreground"
                : "border-border bg-background text-muted-foreground hover:text-foreground"
            )}
          >
            {clearLabel}
          </button>
        ) : null}

        {options.map((o) => {
          const checked = value.includes(o.value);
          const disabled = Boolean(o.disabled);

          return (
            <button
              key={String(o.value)}
              type="button"
              disabled={disabled}
              onClick={() => {
                const next = toggle(value, o.value);
                if (canAddMore(next)) onChange(next);
              }}
              className={classNames(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs shadow-sm transition-colors",
                "cursor-pointer disabled:cursor-not-allowed disabled:opacity-50",
                checked
                  ? "border-ring bg-background text-foreground"
                  : "border-border bg-background text-muted-foreground hover:text-foreground"
              )}
            >
              <span
                className={classNames(
                  "inline-flex h-4 w-4 items-center justify-center rounded-sm border",
                  checked ? "border-ring" : "border-border"
                )}
                aria-hidden="true"
              >
                {checked ? "✓" : ""}
              </span>
              <span className="whitespace-nowrap">{o.label}</span>
            </button>
          );
        })}
      </div>

      {hasNode(message) ? (
        <div
          id={describedBy}
          className={classNames(
            "text-xs",
            error ? "text-destructive" : "text-muted-foreground"
          )}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
