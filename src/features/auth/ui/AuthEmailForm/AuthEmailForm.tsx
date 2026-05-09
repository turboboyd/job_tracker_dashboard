import { Formik } from "formik";
import React from "react";
import type { ObjectSchema } from "yup";

import type { AuthFieldConfig, AuthSubmitLabels } from "../authForms.helpers";
import { AuthFieldsGrid } from "../authForms.sections";
import { AuthFormShell, type AuthFormShellProps } from "../AuthFormShell";
import { AuthSubmitButton } from "../AuthSubmitButton";

interface AuthEmailValues {
  email: string;
  password: string;
}

interface AuthEmailFormProps<Values extends AuthEmailValues> {
  fieldConfigs: AuthFieldConfig<Extract<keyof Values, string>>[];
  footer?: React.ReactNode;
  googleButtonProps?: AuthFormShellProps["googleButtonProps"];
  initialValues: Values;
  isLoading: boolean;
  onClearError: () => void;
  onSubmitValues: (values: Values) => Promise<void>;
  onSuccess: (from: string) => void;
  schema: ObjectSchema<Values>;
  submitLabels: AuthSubmitLabels;
  topError: string | null;
}

export function AuthEmailForm<Values extends AuthEmailValues>({
  fieldConfigs,
  footer,
  googleButtonProps,
  initialValues,
  isLoading,
  onClearError,
  onSubmitValues,
  onSuccess,
  schema,
  submitLabels,
  topError,
}: AuthEmailFormProps<Values>) {
  const shellGoogleButtonProps = googleButtonProps === undefined
    ? { onSuccess }
    : googleButtonProps;

  return (
    <AuthFormShell googleButtonProps={shellGoogleButtonProps} topError={topError}>
      <Formik<Values>
        initialValues={initialValues}
        validationSchema={schema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values) => {
          onClearError();
          await onSubmitValues(values);
        }}
      >
        {(formik) => {
          const disabled = formik.isSubmitting || isLoading;

          return (
            <form onSubmit={formik.handleSubmit} className="space-y-4">
              <AuthFieldsGrid<Values>
                formik={formik}
                configs={fieldConfigs}
                disabled={disabled}
                onFieldFocus={onClearError}
              />

              <AuthSubmitButton
                disabled={disabled}
                isSubmitting={disabled}
                idleText={submitLabels.idleText}
                submittingText={submitLabels.submittingText}
              />

              {footer}
            </form>
          );
        }}
      </Formik>
    </AuthFormShell>
  );
}
