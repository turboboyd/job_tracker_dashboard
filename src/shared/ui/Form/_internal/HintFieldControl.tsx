import React from "react";

import { FieldChrome } from "./FieldChrome";

export interface HintFieldControlSharedProps {
  label?: React.ReactNode | undefined;
  hint?: React.ReactNode | undefined;
  error?: React.ReactNode | undefined;
  required?: boolean | undefined;
  fieldClassName?: string | undefined;
  labelClassName?: string | undefined;
  messageClassName?: string | undefined;
}

type HintFieldReservedProp =
  | keyof HintFieldControlSharedProps
  | "id"
  | "aria-describedby"
  | "aria-invalid";

type HintFieldNativeProps<ControlProps extends object> = Omit<
  ControlProps,
  HintFieldReservedProp
>;

interface HintFieldRenderProps<ControlProps extends object> {
  controlProps: HintFieldNativeProps<ControlProps>;
  resolvedId: string;
  describedBy: string | undefined;
  ariaInvalid: React.AriaAttributes["aria-invalid"] | undefined;
}

type HintFieldControlProps<ControlProps extends object> =
  HintFieldNativeProps<ControlProps> &
    HintFieldControlSharedProps & {
      id?: string | undefined;
      idPrefix: string;
      "aria-describedby"?: string | undefined;
      "aria-invalid"?: React.AriaAttributes["aria-invalid"] | undefined;
      renderControl: (props: HintFieldRenderProps<ControlProps>) => React.ReactNode;
    };

export function HintFieldControl<ControlProps extends object>({
  id,
  idPrefix,
  label,
  hint,
  error,
  required,
  fieldClassName,
  labelClassName,
  messageClassName,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  renderControl,
  ...controlProps
}: HintFieldControlProps<ControlProps>) {
  const hasError = Boolean(error);
  const effectiveInvalid = ariaInvalid ?? (hasError ? true : undefined);

  return (
    <FieldChrome
      id={id}
      idPrefix={idPrefix}
      label={label}
      message={hint}
      error={error}
      required={required}
      fieldClassName={fieldClassName}
      labelClassName={labelClassName}
      messageClassName={messageClassName}
      ariaDescribedBy={ariaDescribedBy}
    >
      {({ resolvedId, describedBy }) =>
        renderControl({
          controlProps: controlProps as HintFieldNativeProps<ControlProps>,
          resolvedId,
          describedBy,
          ariaInvalid: effectiveInvalid,
        })
      }
    </FieldChrome>
  );
}
