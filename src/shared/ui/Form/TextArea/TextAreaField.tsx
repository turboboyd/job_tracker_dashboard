import React from "react";

import type { FieldChromeSharedProps } from "../_internal/FieldChrome";
import { FieldControl } from "../_internal/FieldControl";

import { TextArea, type TextAreaIntent, type TextAreaProps } from "./TextArea";

export type TextAreaFieldProps = TextAreaProps & FieldChromeSharedProps;

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  (props, ref) => (
    <FieldControl<TextAreaProps, TextAreaIntent>
      {...props}
      idPrefix="textarea"
      renderControl={({
        controlProps,
        resolvedId,
        describedBy,
        intent,
        ariaInvalid,
      }) => (
        <TextArea
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

TextAreaField.displayName = "TextAreaField";
