import React from "react";

import {
  FieldChrome,
  resolveFieldControlState,
  type FieldChromeSharedProps,
} from "./FieldChrome";

type FieldControlReservedProp =
  | keyof FieldChromeSharedProps
  | "id"
  | "intent"
  | "state"
  | "aria-describedby"
  | "aria-invalid";

type FieldControlNativeProps<ControlProps extends object> = Omit<
  ControlProps,
  FieldControlReservedProp
>;

interface FieldControlRenderProps<
  ControlProps extends object,
  Intent extends string,
> {
  controlProps: FieldControlNativeProps<ControlProps>;
  resolvedId: string;
  describedBy: string | undefined;
  intent: Intent;
  ariaInvalid: React.AriaAttributes["aria-invalid"] | undefined;
}

type FieldControlProps<
  ControlProps extends object,
  Intent extends string,
> = FieldControlNativeProps<ControlProps> &
  FieldChromeSharedProps & {
    id?: string | undefined;
    idPrefix: string;
    intent?: Intent | null | undefined;
    state?: string | null | undefined;
    "aria-describedby"?: string | undefined;
    "aria-invalid"?: React.AriaAttributes["aria-invalid"] | undefined;
    renderControl: (
      props: FieldControlRenderProps<ControlProps, Intent>
    ) => React.ReactNode;
  };

export function FieldControl<
  ControlProps extends object,
  Intent extends string,
>({
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
  intent,
  state,
  "aria-describedby": ariaDescribedBy,
  "aria-invalid": ariaInvalid,
  renderControl,
  ...controlProps
}: FieldControlProps<ControlProps, Intent>) {
  const { intent: effectiveIntent, ariaInvalid: effectiveInvalid } =
    resolveFieldControlState<Intent>({
      ariaInvalid,
      error,
      intent,
      state,
    });

  return (
    <FieldChrome
      id={id}
      idPrefix={idPrefix}
      label={label}
      description={description}
      message={message}
      messageIntent={messageIntent}
      error={error}
      required={required}
      fieldClassName={fieldClassName}
      labelClassName={labelClassName}
      descriptionClassName={descriptionClassName}
      messageClassName={messageClassName}
      ariaDescribedBy={ariaDescribedBy}
    >
      {({ resolvedId, describedBy }) =>
        renderControl({
          controlProps: controlProps as FieldControlNativeProps<ControlProps>,
          resolvedId,
          describedBy,
          intent: effectiveIntent,
          ariaInvalid: effectiveInvalid,
        })
      }
    </FieldChrome>
  );
}
