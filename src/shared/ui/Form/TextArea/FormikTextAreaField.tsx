import type { FormikErrors, FormikProps, FormikTouched } from "formik";

import { getFieldError } from "src/shared/lib/form";

import { TextAreaField, type TextAreaFieldProps } from "./TextAreaField";

type NameOf<T> = Extract<keyof T, string>;

export type FormikTextAreaFieldProps<T> = Omit<
  TextAreaFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "id"
> & {
  formik: FormikProps<T>;
  name: NameOf<T> | string;
  id?: string;
  touched?: FormikTouched<T>;
  errors?: FormikErrors<T>;
};

export function FormikTextAreaField<T>({
  formik,
  name,
  id,
  touched,
  errors,
  ...props
}: FormikTextAreaFieldProps<T>) {
  const usedTouched = touched ?? formik.touched;
  const usedErrors = errors ?? formik.errors;

  const error = getFieldError<T>(name, usedTouched, usedErrors);

  const field = formik.getFieldProps(String(name));
  const normalizedValue =
    field.value === null || field.value === undefined
      ? ""
      : String(field.value);

  return (
    <TextAreaField
      {...props}
      id={id ?? String(name)}
      name={String(name)}
      value={normalizedValue}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
