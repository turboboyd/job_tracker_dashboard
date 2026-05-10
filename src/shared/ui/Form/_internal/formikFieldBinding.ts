import type { FormikErrors, FormikProps, FormikTouched } from "formik";

import { getFieldError } from "src/shared/lib/form";

export type FormikFieldName<T> = Extract<keyof T, string> | string;

export interface FormikStringFieldProps<T> {
  formik: FormikProps<T>;
  name: FormikFieldName<T>;
  id?: string | undefined;
  touched?: FormikTouched<T> | undefined;
  errors?: FormikErrors<T> | undefined;
}

export function getFormikStringFieldBinding<T>({
  formik,
  name,
  id,
  touched,
  errors,
}: FormikStringFieldProps<T>) {
  const fieldName = String(name);
  const field = formik.getFieldProps(fieldName);
  const value =
    field.value === null || field.value === undefined
      ? ""
      : String(field.value);

  return {
    id: id ?? fieldName,
    name: fieldName,
    value,
    onChange: field.onChange,
    onBlur: field.onBlur,
    error: getFieldError<T>(fieldName, touched ?? formik.touched, errors ?? formik.errors),
  };
}
