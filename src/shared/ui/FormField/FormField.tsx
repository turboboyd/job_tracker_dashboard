import React, { useId } from "react";

type FieldRenderProps = {
  id: string;
  describedBy?: string;
  invalid: boolean;
  errorId?: string;
  hintId?: string;
};

type Props = {
  label: string;
  required?: boolean;

  error?: string;
  hint?: string;

  htmlFor?: string;

  children: React.ReactNode | ((p: FieldRenderProps) => React.ReactNode);
};

export function FormField({
  label,
  required,
  error,
  hint,
  htmlFor,
  children,
}: Props) {
  const autoId = useId();
  const id = htmlFor ?? `field-${autoId}`;

  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  const invalid = Boolean(error);

  return (
    <div className="flex flex-col gap-1">
      <label
        className="text-sm font-medium text-muted-foreground leading-normal"
        htmlFor={id}
      >
        {label}{" "}
        {required ? (
          <span className="text-destructive align-middle">*</span>
        ) : null}
      </label>

      {typeof children === "function"
        ? children({ id, describedBy, invalid, errorId, hintId })
        : children}

      {hint ? (
        <div
          id={hintId}
          className="text-xs text-muted-foreground leading-normal"
        >
          {hint}
        </div>
      ) : null}

      {error ? (
        <div
          id={errorId}
          className="text-xs text-destructive leading-normal"
          role="alert"
        >
          {error}
        </div>
      ) : null}
    </div>
  );
}
