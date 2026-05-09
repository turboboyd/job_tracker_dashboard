import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { createLoginSchema, type LoginValues } from "src/entities/auth/validation";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";
import { useAuthActions, useAuthSelectors } from "../../model";
import { AuthEmailForm } from "../AuthEmailForm/AuthEmailForm";
import {
  buildLoginFieldConfigs,
  buildLoginSubmitLabels,
  LOGIN_ERROR_OVERRIDES,
} from "../authForms.helpers";

export interface LoginFormProps {
  onSuccess: (from: string) => void;
}

const initialValues: LoginValues = { email: "", password: "" };

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signInWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const fieldConfigs = useMemo(() => buildLoginFieldConfigs(t), [t]);
  const submitLabels = useMemo(() => buildLoginSubmitLabels(t), [t]);
  const topError = error
    ? mapFirebaseAuthError(error, t, LOGIN_ERROR_OVERRIDES)
    : null;

  return (
    <AuthEmailForm<LoginValues>
      fieldConfigs={fieldConfigs}
      initialValues={initialValues}
      isLoading={isLoading}
      onClearError={clearAuthError}
      onSubmitValues={async (values) => {
        await signInWithEmail(values.email.trim(), values.password);
        onSuccess("");
      }}
      onSuccess={onSuccess}
      schema={schema}
      submitLabels={submitLabels}
      topError={topError}
    />
  );
};
