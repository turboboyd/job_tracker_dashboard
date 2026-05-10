import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { createLoginSchema, type LoginValues } from "src/entities/auth/validation";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";
import { useAuthActions, useAuthSelectors } from "../../model";
import { AuthEmailForm } from "../AuthEmailForm/AuthEmailForm";
import {
  buildEmailPasswordFieldConfigs,
  LOGIN_ERROR_OVERRIDES,
  REGISTER_ERROR_OVERRIDES,
} from "../authForms.helpers";

import {
  buildEmailPasswordSubmitLabels,
  EMAIL_PASSWORD_INITIAL_VALUES,
  getEmailPasswordAutoComplete,
  getEmailPasswordFallbackKey,
  type AuthMode,
} from "./emailPasswordAuthForm.helpers";
import { AuthModeSwitch } from "./emailPasswordAuthForm.sections";

export interface EmailPasswordAuthFormProps {
  onSuccess?: () => void;
}

export const EmailPasswordAuthForm: React.FC<EmailPasswordAuthFormProps> = ({
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { signInWithEmail, signUpWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();
  const [mode, setMode] = useState<AuthMode>("signin");

  const schema = useMemo(() => createLoginSchema(t), [t]);
  const fieldConfigs = useMemo(
    () => buildEmailPasswordFieldConfigs(t, getEmailPasswordAutoComplete(mode)),
    [mode, t],
  );
  const submitLabels = useMemo(
    () => buildEmailPasswordSubmitLabels(t, mode),
    [mode, t],
  );
  const errorOverrides =
    mode === "signin" ? LOGIN_ERROR_OVERRIDES : REGISTER_ERROR_OVERRIDES;

  const topError = error
    ? mapFirebaseAuthError(
        error,
        t,
        errorOverrides,
        getEmailPasswordFallbackKey(mode),
      )
    : null;

  return (
    <AuthEmailForm<LoginValues>
      fieldConfigs={fieldConfigs}
      footer={
        <AuthModeSwitch
          mode={mode}
          noAccountText={t("auth.noAccount")}
          haveAccountText={t("auth.haveAccount")}
          switchToSignUpText={t("auth.emailPassword.switchToSignUp")}
          switchToSignInText={t("auth.emailPassword.switchToSignIn")}
          onSwitchToSignup={() => {
            clearAuthError();
            setMode("signup");
          }}
          onSwitchToSignin={() => {
            clearAuthError();
            setMode("signin");
          }}
        />
      }
      googleButtonProps={null}
      initialValues={EMAIL_PASSWORD_INITIAL_VALUES}
      isLoading={isLoading}
      onClearError={clearAuthError}
      onSubmitValues={async (values) => {
        const email = values.email.trim();

        if (mode === "signin") {
          await signInWithEmail(email, values.password);
        } else {
          await signUpWithEmail(email, values.password);
        }

        onSuccess?.();
      }}
      onSuccess={() => onSuccess?.()}
      schema={schema}
      submitLabels={submitLabels}
      topError={topError}
    />
  );
};
