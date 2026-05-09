import {
  getFormikStringFieldBinding,
  type FormikStringFieldProps,
} from "../_internal/formikFieldBinding";

import { InputField, type InputFieldProps } from "./InputField";

export type FormikInputFieldProps<T> = Omit<
  InputFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "id"
> & FormikStringFieldProps<T>;

export function FormikInputField<T>({
  formik,
  name,
  id,
  touched,
  errors,
  ...props
}: FormikInputFieldProps<T>) {
  const fieldBinding = getFormikStringFieldBinding({
    errors,
    formik,
    id,
    name,
    touched,
  });

  return (
    <InputField
      {...props}
      {...fieldBinding}
    />
  );
}
