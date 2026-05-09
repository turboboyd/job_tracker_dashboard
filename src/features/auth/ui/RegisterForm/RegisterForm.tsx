import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import {
  createRegisterSchema,
  type RegisterValues,
} from "src/entities/auth/validation";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";
import { useAuthActions, useAuthSelectors } from "../../model";
import { AuthEmailForm } from "../AuthEmailForm/AuthEmailForm";
import {
  buildRegisterFieldConfigs,
  buildRegisterSubmitLabels,
  REGISTER_ERROR_OVERRIDES,
} from "../authForms.helpers";

export interface RegisterFormProps {
  onSuccess: (from: string) => void;
}

const initialValues: RegisterValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signUpWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createRegisterSchema(t), [t]);
  const fieldConfigs = useMemo(() => buildRegisterFieldConfigs(t), [t]);
  const submitLabels = useMemo(() => buildRegisterSubmitLabels(t), [t]);
  const topError = error
    ? mapFirebaseAuthError(error, t, REGISTER_ERROR_OVERRIDES)
    : null;

  return (
    <AuthEmailForm<RegisterValues>
      fieldConfigs={fieldConfigs}
      initialValues={initialValues}
      isLoading={isLoading}
      onClearError={clearAuthError}
      onSubmitValues={async (values) => {
        await signUpWithEmail(values.email.trim(), values.password);
        onSuccess("");
      }}
      onSuccess={onSuccess}
      schema={schema}
      submitLabels={submitLabels}
      topError={topError}
    />
  );
};
