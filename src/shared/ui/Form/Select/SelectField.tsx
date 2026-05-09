import {
  HintFieldControl,
  type HintFieldControlSharedProps,
} from "../_internal/HintFieldControl";

import { Select, type SelectProps } from "./Select";

export type SelectFieldProps<T extends string> = Omit<
  SelectProps<T>,
  "aria-describedby" | "aria-invalid"
> &
  HintFieldControlSharedProps;

type SelectIntent<T extends string> = SelectProps<T>["intent"];

export function SelectField<T extends string>(props: SelectFieldProps<T>) {
  return (
    <HintFieldControl<SelectProps<T>>
      {...props}
      idPrefix="select"
      renderControl={({ controlProps, resolvedId, describedBy, ariaInvalid }) => {
        const resolvedIntent: SelectIntent<T> =
          controlProps.intent ?? (ariaInvalid ? "error" : undefined);

        return (
          <Select
            {...controlProps}
            id={resolvedId}
            {...(resolvedIntent ? { intent: resolvedIntent } : {})}
            aria-invalid={ariaInvalid}
            aria-describedby={describedBy}
          />
        );
      }}
    />
  );
}
