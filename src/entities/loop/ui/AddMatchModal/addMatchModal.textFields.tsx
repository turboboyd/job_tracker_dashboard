import type { FormikProps } from "formik";
import type { ChangeEvent, MutableRefObject } from "react";

import { FormField, Input, TextArea } from "src/shared/ui";

import { detectPlatformFromUrl } from "../../lib/detectPlatformFromUrl";

import {
  getFieldError,
  setFormValue,
  type AddMatchFormValues,
  type AddMatchModalLabels,
  type AddMatchTextFieldConfig,
} from "./addMatchModal.helpers";

interface AddMatchTextInputFieldProps {
  config: AddMatchTextFieldConfig;
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
}

export function AddMatchTextInputField({
  config,
  disabled,
  formik,
}: AddMatchTextInputFieldProps) {
  return (
    <FormField
      label={config.label}
      required
      error={getFieldError(formik, config.name)}
    >
      {({ describedBy, id, invalid }) => (
        <Input
          id={id}
          name={config.name}
          value={formik.values[config.name]}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={config.placeholder}
          state={invalid ? "error" : "default"}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
        />
      )}
    </FormField>
  );
}

interface AddMatchUrlFieldProps {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  labels: AddMatchModalLabels;
  platformManuallySetRef: MutableRefObject<boolean>;
}

export function AddMatchUrlField({
  disabled,
  formik,
  labels,
  platformManuallySetRef,
}: AddMatchUrlFieldProps) {
  const handleUrlChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextUrl = event.target.value;
    setFormValue(formik, "url", nextUrl);

    const detectedPlatform = detectPlatformFromUrl(nextUrl);
    if (!platformManuallySetRef.current && detectedPlatform) {
      setFormValue(formik, "platform", detectedPlatform);
    }
  };

  return (
    <FormField
      label={labels.jobUrl}
      required
      hint={labels.jobUrlHint}
      error={getFieldError(formik, "url")}
    >
      {({ describedBy, id, invalid }) => (
        <Input
          id={id}
          name="url"
          value={formik.values.url}
          onChange={handleUrlChange}
          onBlur={formik.handleBlur}
          placeholder={labels.jobUrlPlaceholder}
          state={invalid ? "error" : "default"}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
        />
      )}
    </FormField>
  );
}

interface AddMatchDescriptionFieldProps {
  disabled: boolean;
  formik: FormikProps<AddMatchFormValues>;
  labels: AddMatchModalLabels;
}

export function AddMatchDescriptionField({
  disabled,
  formik,
  labels,
}: AddMatchDescriptionFieldProps) {
  return (
    <FormField
      label={labels.description}
      required
      error={getFieldError(formik, "description")}
    >
      {({ describedBy, id, invalid }) => (
        <TextArea
          id={id}
          name="description"
          value={formik.values.description}
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          placeholder={labels.descriptionPlaceholder}
          state={invalid ? "error" : "default"}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          disabled={disabled}
        />
      )}
    </FormField>
  );
}

