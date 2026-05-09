import {
  HintFieldControl,
  type HintFieldControlSharedProps,
} from "../_internal/HintFieldControl";

import { DebouncedInput, type DebouncedInputProps } from "./DebouncedInput";

export type DebouncedInputFieldProps =
  DebouncedInputProps & HintFieldControlSharedProps;

export function DebouncedInputField(props: DebouncedInputFieldProps) {
  return (
    <HintFieldControl<DebouncedInputProps>
      {...props}
      idPrefix="debounced-input"
      renderControl={({ controlProps, resolvedId, describedBy, ariaInvalid }) => (
        <DebouncedInput
          {...controlProps}
          id={resolvedId}
          aria-invalid={ariaInvalid}
          aria-describedby={describedBy}
        />
      )}
    />
  );
}
