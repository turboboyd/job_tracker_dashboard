import React from "react";

import type { FieldChromeSharedProps } from "../_internal/FieldChrome";
import { FieldControl } from "../_internal/FieldControl";

import type { InputIntent } from "./BaseInput";
import { Input, type InputProps } from "./Input";

export type InputFieldProps = InputProps & FieldChromeSharedProps;

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  (props, ref) => (
    <FieldControl<InputProps, InputIntent>
      {...props}
      idPrefix="input"
      renderControl={({
        controlProps,
        resolvedId,
        describedBy,
        intent,
        ariaInvalid,
      }) => (
        <Input
          ref={ref}
          id={resolvedId}
          intent={intent}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
          {...controlProps}
        />
      )}
    />
  )
);

InputField.displayName = "InputField";
