import type { FormikErrors, FormikTouched, FormikProps } from "formik";

import { getFieldError } from "src/shared/lib/form";

import { InputField, type InputFieldProps } from "./InputField";

type NameOf<T> = Extract<keyof T, string>;

export type FormikInputFieldProps<T> = Omit<
  InputFieldProps,
  "name" | "value" | "onChange" | "onBlur" | "error" | "id"
> & {
  formik: FormikProps<T>;
  name: NameOf<T> | string;
  id?: string;
  touched?: FormikTouched<T>;
  errors?: FormikErrors<T>;
};

export function FormikInputField<T>({
  formik,
  name,
  id,
  touched,
  errors,
  ...props
}: FormikInputFieldProps<T>) {
  const usedTouched = touched ?? formik.touched;
  const usedErrors = errors ?? formik.errors;

  const error = getFieldError<T>(name, usedTouched, usedErrors);

  const field = formik.getFieldProps(String(name));
  const value =
    field.value === null || field.value === undefined
      ? ""
      : String(field.value);

  return (
    <InputField
      {...props}
      id={id ?? String(name)}
      name={String(name)}
      value={value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={error}
    />
  );
}
