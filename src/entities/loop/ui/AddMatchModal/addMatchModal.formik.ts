import type { FormikProps } from "formik";

import type { AddMatchFormValues } from "./addMatchModal.types";

export function setFormValue<Key extends keyof AddMatchFormValues>(
  formik: FormikProps<AddMatchFormValues>,
  field: Key,
  value: AddMatchFormValues[Key],
) {
  formik.setFieldValue(field, value).catch(() => undefined);
}

export function getFieldError<Key extends keyof AddMatchFormValues>(
  formik: FormikProps<AddMatchFormValues>,
  field: Key,
) {
  return formik.touched[field] ? formik.errors[field] : undefined;
}

