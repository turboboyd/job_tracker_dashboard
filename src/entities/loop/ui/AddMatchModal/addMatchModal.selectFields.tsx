import type { FormikProps } from "formik";
import type { ChangeEvent } from "react";

import { FormField } from "src/shared/ui";

import type {
  AddMatchFormValues,
  AddMatchSelectOption,
} from "./addMatchModal.helpers";

const SELECT_CLASS_NAME =
  "h-10 w-full rounded-xl border border-border bg-input px-3 text-sm text-foreground";

interface AddMatchSelectFieldProps<Value extends string> {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  label: string;
  name: "platform" | "status";
  onChange?: (event: ChangeEvent<HTMLSelectElement>) => void;
  options: AddMatchSelectOption<Value>[];
}

function AddMatchSelectField<Value extends string>({
  disabled,
  formik,
  label,
  name,
  onChange,
  options,
}: AddMatchSelectFieldProps<Value>) {
  return (
    <FormField label={label} required>
      {({ describedBy, id }) => (
        <select
          id={id}
          name={name}
          value={formik.values[name]}
          onChange={onChange ?? formik.handleChange}
          onBlur={formik.handleBlur}
          aria-describedby={describedBy}
          disabled={disabled}
          className={SELECT_CLASS_NAME}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </FormField>
  );
}

interface AddMatchPlatformFieldProps {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  label: string;
  onManualPlatformSelect: () => void;
  options: AddMatchSelectOption<AddMatchFormValues["platform"]>[];
}

export function AddMatchPlatformField({
  disabled,
  formik,
  label,
  onManualPlatformSelect,
  options,
}: AddMatchPlatformFieldProps) {
  const handlePlatformChange = (event: ChangeEvent<HTMLSelectElement>) => {
    onManualPlatformSelect();
    formik.handleChange(event);
  };

  return (
    <AddMatchSelectField
      disabled={disabled}
      formik={formik}
      label={label}
      name="platform"
      onChange={handlePlatformChange}
      options={options}
    />
  );
}

interface AddMatchStatusFieldProps {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  label: string;
  options: AddMatchSelectOption<AddMatchFormValues["status"]>[];
}

export function AddMatchStatusField({
  disabled,
  formik,
  label,
  options,
}: AddMatchStatusFieldProps) {
  return (
    <AddMatchSelectField
      disabled={disabled}
      formik={formik}
      label={label}
      name="status"
      options={options}
    />
  );
}

