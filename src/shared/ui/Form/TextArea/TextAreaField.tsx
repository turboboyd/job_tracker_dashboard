import React, { useId } from "react";

import { classNames } from "src/shared/lib";

import { TextArea, type TextAreaIntent, type TextAreaProps } from "./TextArea";

function getMessageColorClass(intent: Exclude<TextAreaIntent, "error">): string {
  switch (intent) {
    case "success":
      return "text-emerald-600";
    case "warning":
      return "text-amber-600";
    case "default":
    default:
      return "text-muted-foreground";
  }
}

export type TextAreaFieldProps = TextAreaProps & {
  label?: React.ReactNode;
  description?: React.ReactNode;

  message?: React.ReactNode;
  messageIntent?: Exclude<TextAreaIntent, "error">;

  error?: React.ReactNode;
  required?: boolean;

  fieldClassName?: string;
  labelClassName?: string;
  descriptionClassName?: string;
  messageClassName?: string;
};

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
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
    const resolvedId = id ?? `textarea-${autoId}`;

    const hasError = Boolean(error);
    const effectiveIntent: TextAreaIntent =
      intent ?? (state === "error" || hasError ? "error" : "default");
    const effectiveInvalid = ariaInvalid ?? (hasError ? true : undefined);

    const descriptionId = description ? `${resolvedId}-desc` : undefined;
    const messageId = message || error ? `${resolvedId}-msg` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, messageId].filter(Boolean).join(" ") || undefined;

    let helperBlock: React.ReactNode = null;

    if (error) {
      helperBlock = (
        <div
          id={messageId}
          className={classNames("text-xs text-destructive leading-normal", messageClassName)}
          role="alert"
        >
          {error}
        </div>
      );
    } else if (message) {
      helperBlock = (
        <div
          id={messageId}
          className={classNames("text-xs leading-normal", getMessageColorClass(messageIntent), messageClassName)}
        >
          {message}
        </div>
      );
    }

    return (
      <div className={classNames("grid gap-1.5", fieldClassName)}>
        {label ? (
          <label
            htmlFor={resolvedId}
            className={classNames("text-sm font-medium text-foreground leading-normal", labelClassName)}
          >
            {label}{" "}
            {required ? <span className="text-destructive align-middle">*</span> : null}
          </label>
        ) : null}

        {description ? (
          <div
            id={descriptionId}
            className={classNames("text-xs text-muted-foreground leading-normal", descriptionClassName)}
          >
            {description}
          </div>
        ) : null}

        <TextArea
          ref={ref}
          id={resolvedId}
          intent={effectiveIntent}
          aria-invalid={effectiveInvalid}
          aria-describedby={describedBy}
          {...props}
        />

        {helperBlock}
      </div>
    );
  }
);

TextAreaField.displayName = "TextAreaField";
