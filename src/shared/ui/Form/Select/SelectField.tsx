import React from "react";

import { classNames } from "src/shared/lib";

import { Select, type SelectProps } from "./Select";

export type SelectFieldProps<T extends string> = Omit<
  SelectProps<T>,
  "aria-describedby" | "aria-invalid"
> & {
  label?: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  required?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  messageClassName?: string;
};

function hasNode(v: React.ReactNode) {
  return v !== null && v !== undefined && v !== false && v !== "";
}

type SelectIntent<T extends string> = SelectProps<T>["intent"];

export function SelectField<T extends string>({
  id,
  label,
  hint,
  error,
  required,

  fieldClassName,
  labelClassName,
  messageClassName,

  intent,
  state,

  ...props
}: SelectFieldProps<T>) {
  const autoId = React.useId();
  const usedId = id ?? autoId;

  const hasError = Boolean(error);
  const message = error ?? hint;

  const describedBy = hasNode(message) ? `${usedId}__message` : undefined;

  const resolvedIntent: SelectIntent<T> =
    intent ?? (hasError ? "error" : undefined);

  return (
    <div className={classNames("grid gap-1.5", fieldClassName)}>
      {label ? (
        <label
          htmlFor={usedId}
          className={classNames("text-sm font-medium text-foreground", labelClassName)}
        >
          {label} {required ? <span className="text-destructive">*</span> : null}
        </label>
      ) : null}

      <Select
        {...props}
        id={usedId}
        intent={resolvedIntent}
        state={state}
        aria-invalid={hasError ? true : undefined}
        aria-describedby={describedBy}
      />

      {hasNode(message) ? (
        <div
          id={describedBy}
          className={classNames(
            "text-xs",
            hasError ? "text-destructive" : "text-muted-foreground",
            messageClassName
          )}
        >
          {message}
        </div>
      ) : null}
    </div>
  );
}
