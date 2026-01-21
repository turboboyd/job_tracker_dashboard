import React, { useId } from "react";

import { classNames } from "src/shared/lib";

import type { InputIntent } from "./BaseInput";
import { Input, type InputProps } from "./Input";

export type InputFieldProps = InputProps & {
  label?: React.ReactNode;
  description?: React.ReactNode;
  message?: React.ReactNode;
  messageIntent?: Exclude<InputIntent, "error">;
  error?: React.ReactNode;
  required?: boolean;
  fieldClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  messageClassName?: string;
};

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (
    {
      id,
      label,
      description,
      message,
      messageIntent = "default",
      error,
      required,

      fieldClassName,
      labelClassName,
      descriptionClassName,
      messageClassName,

      intent,
      state,
      "aria-describedby": ariaDescribedBy,
      "aria-invalid": ariaInvalid,
      ...props
    },
    ref
  ) => {
    const autoId = useId();
    const resolvedId = id ?? `input-${autoId}`;

    const hasError = Boolean(error);
    const effectiveIntent: InputIntent = intent ?? (state === "error" || hasError ? "error" : "default");
    const effectiveInvalid = ariaInvalid ?? (hasError ? true : undefined);

    const descriptionId = description ? `${resolvedId}-desc` : undefined;
    const messageId = message || error ? `${resolvedId}-msg` : undefined;

    const describedBy = [ariaDescribedBy, descriptionId, messageId]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={classNames("grid gap-1.5", fieldClassName)}>
        {label ? (
          <label
            htmlFor={resolvedId}
            className={classNames(
              "text-sm font-medium text-foreground leading-normal",
              labelClassName
            )}
          >
            {label}{" "}
            {required ? (
              <span className="text-destructive align-middle">*</span>
            ) : null}
          </label>
        ) : null}

        {description ? (
          <div
            id={descriptionId}
            className={classNames(
              "text-xs text-muted-foreground leading-normal",
              descriptionClassName
            )}
          >
            {description}
          </div>
        ) : null}

        <Input
          ref={ref}
          id={resolvedId}
          intent={effectiveIntent}
          aria-invalid={effectiveInvalid}
          aria-describedby={describedBy}
          {...props}
        />

        {error ? (
          <div
            id={messageId}
            className={classNames(
              "text-xs text-destructive leading-normal",
              messageClassName
            )}
            role="alert"
          >
            {error}
          </div>
        ) : message ? (
          <div
            id={messageId}
            className={classNames(
              "text-xs leading-normal",
              messageIntent === "success"
                ? "text-emerald-600"
                : messageIntent === "warning"
                ? "text-amber-600"
                : "text-muted-foreground",
              messageClassName
            )}
          >
            {message}
          </div>
        ) : null}
      </div>
    );
  }
);

InputField.displayName = "InputField";
