import React from "react";

import { classNames } from "src/shared/lib";

import { DebouncedInput, type DebouncedInputProps } from "./DebouncedInput";

export type DebouncedInputFieldProps = DebouncedInputProps & {
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

export function DebouncedInputField({
  id,
  label,
  hint,
  error,
  required,

  fieldClassName,
  labelClassName,
  messageClassName,

  ...props
}: DebouncedInputFieldProps) {
  const autoId = React.useId();
  const usedId = id ?? autoId;

  const hasError = Boolean(error);
  const message = error ?? hint;
  const describedBy = hasNode(message) ? `${usedId}__message` : undefined;

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

      <DebouncedInput
        {...props}
        id={usedId}
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
