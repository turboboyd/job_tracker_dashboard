import type { FormikProps } from "formik";

import { FormikInputField } from "src/shared/ui";

import type { AuthFieldConfig } from "./authForms.helpers";

interface AuthFieldsGridProps<T extends object> {
  configs: AuthFieldConfig<Extract<keyof T, string>>[];
  disabled: boolean;
  formik: FormikProps<T>;
  onFieldFocus: () => void;
}

export function AuthFieldsGrid<T extends object>({
  configs,
  disabled,
  formik,
  onFieldFocus,
}: AuthFieldsGridProps<T>) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {configs.map((config) => (
        <FormikInputField
          key={config.name}
          formik={formik}
          name={config.name}
          label={config.label}
          required={config.required}
          placeholder={config.placeholder}
          autoComplete={config.autoComplete}
          disabled={disabled}
          onFocus={onFieldFocus}
          {...(config.inputMode ? { inputMode: config.inputMode } : {})}
          {...(config.preset ? { preset: config.preset } : {})}
        />
      ))}
    </div>
  );
}
