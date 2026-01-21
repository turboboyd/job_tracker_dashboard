import type { FormikErrors, FormikProps, FormikTouched } from "formik";
import React from "react";

import { getFieldError } from "src/shared/lib/form/getFieldError";

import { SelectField, type SelectFieldProps } from "./SelectField";

type NameOf<T> = Extract<keyof T, string>;

export type FormikSelectFieldProps<T, V extends string> = Omit<
  SelectFieldProps<V>,
  "name" | "value" | "onChange" | "onBlur" | "error" | "id"
> & {
  formik: FormikProps<T>;
  name: NameOf<T> | string;
  id?: string;
  touched?: FormikTouched<T>;
  errors?: FormikErrors<T>;
};

export function FormikSelectField<T, V extends string>({
  formik,
  name,
  id,
  touched,
  errors,
  ...props
}: FormikSelectFieldProps<T, V>) {
  const usedTouched = touched ?? formik.touched;
  const usedErrors = errors ?? formik.errors;

  const error = getFieldError<T>(String(name), usedTouched, usedErrors);

  const field = formik.getFieldProps(String(name));
  const value = (field.value ?? "") as V;

  return (
    <SelectField<V>
      {...props}
      id={id ?? String(name)}
      name={String(name)}
      value={value}
      onChange={(v) => formik.setFieldValue(String(name), v)}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
