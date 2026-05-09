import {
  getFormikStringFieldBinding,
  type FormikStringFieldProps,
} from "../_internal/formikFieldBinding";

import { TextAreaField, type TextAreaFieldProps } from "./TextAreaField";

export type FormikTextAreaFieldProps<T> = Omit<
  TextAreaFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "id"
> & FormikStringFieldProps<T>;

export function FormikTextAreaField<T>({
  formik,
  name,
  id,
  touched,
  errors,
  ...props
}: FormikTextAreaFieldProps<T>) {
  const fieldBinding = getFormikStringFieldBinding({
    errors,
    formik,
    id,
    name,
    touched,
  });

  return (
    <TextAreaField
      {...props}
      {...fieldBinding}
    />
  );
}
