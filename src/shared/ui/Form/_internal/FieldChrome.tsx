import React, { useId } from "react";

import { classNames } from "src/shared/lib";

export type FieldHelperIntent = "default" | "success" | "warning";

export interface FieldChromeSharedProps {
  label?: React.ReactNode | undefined;
  description?: React.ReactNode | undefined;
  message?: React.ReactNode | undefined;
  messageIntent?: FieldHelperIntent | undefined;
  error?: React.ReactNode | undefined;
  required?: boolean | undefined;
  fieldClassName?: string | undefined;
  labelClassName?: string | undefined;
  descriptionClassName?: string | undefined;
  messageClassName?: string | undefined;
}

interface FieldChromeRenderProps {
  resolvedId: string;
  describedBy: string | undefined;
  invalid: boolean | undefined;
}

interface FieldChromeProps extends FieldChromeSharedProps {
  id?: string | undefined;
  idPrefix: string;
  ariaDescribedBy?: string | undefined;
  children: (props: FieldChromeRenderProps) => React.ReactNode;
}

interface ResolveFieldControlStateArgs<Intent extends string> {
  ariaInvalid?: React.AriaAttributes["aria-invalid"] | undefined;
  error?: React.ReactNode | undefined;
  intent?: Intent | null | undefined;
  state?: string | null | undefined;
}

interface ResolvedFieldControlState<Intent extends string> {
  intent: Intent;
  ariaInvalid: React.AriaAttributes["aria-invalid"] | undefined;
}

function getMessageColorClass(intent: FieldHelperIntent): string {
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

export function resolveFieldControlState<Intent extends string>({
  ariaInvalid,
  error,
  intent,
  state,
}: ResolveFieldControlStateArgs<Intent>): ResolvedFieldControlState<Intent> {
  const hasError = Boolean(error);
  const fallbackIntent = (state === "error" || hasError ? "error" : "default") as Intent;

  return {
    intent: intent ?? fallbackIntent,
    ariaInvalid: ariaInvalid ?? (hasError ? true : undefined),
  };
}

export function FieldChrome({
  id,
  idPrefix,
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
  ariaDescribedBy,
  children,
}: FieldChromeProps) {
  const autoId = useId();
  const resolvedId = id ?? `${idPrefix}-${autoId}`;

  const hasError = Boolean(error);
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
        className={classNames(
          "text-xs leading-normal",
          getMessageColorClass(messageIntent),
          messageClassName
        )}
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
          {label} {required ? <span className="text-destructive align-middle">*</span> : null}
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

      {children({ resolvedId, describedBy, invalid: hasError ? true : undefined })}

      {helperBlock}
    </div>
  );
}
