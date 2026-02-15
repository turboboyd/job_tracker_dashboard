import { Formik } from "formik";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthActions, useAuthSelectors } from "src/entities/auth";
import {
  createRegisterSchema,
  type RegisterValues,
} from "src/entities/auth/model/validation";
import { FormikInputField, InlineError } from "src/shared/ui";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";
import { AuthFormShell } from "../AuthFormShell";
import { AuthSubmitButton } from "../AuthSubmitButton";

export type RegisterFormProps = {
  onSuccess: (from: string) => void;
};

const initialValues: RegisterValues = {
  email: "",
  password: "",
  confirmPassword: "",
};

const AUTH_CODE_EMAIL_ALREADY_IN_USE = "auth/email-already-in-use";

// eslint-disable-next-line sonarjs/no-hardcoded-passwords -- Firebase auth error code
const AUTH_CODE_WEAK_PASSWORD = "auth/weak-password";

const REGISTER_ERROR_OVERRIDES: Record<string, string> = {
  [AUTH_CODE_EMAIL_ALREADY_IN_USE]: "auth.errors.emailAlreadyInUse",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords -- i18n translation key, not a credential 
  [AUTH_CODE_WEAK_PASSWORD]: "auth.errors.weakPassword",
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signUpWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createRegisterSchema(t), [t]);

  return (
    <AuthFormShell googleButtonProps={{ onSuccess }}>
      <Formik<RegisterValues>
        initialValues={initialValues}
        validationSchema={schema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values) => {
          clearAuthError();
          await signUpWithEmail(values.email.trim(), values.password);
          onSuccess("");
        }}
      >
        {(f) => {
          const commonError = error
            ? mapFirebaseAuthError(error, t, REGISTER_ERROR_OVERRIDES)
            : undefined;

          const disabled = f.isSubmitting || isLoading;

          return (
            <form onSubmit={f.handleSubmit} className="space-y-4">
              {commonError ? <InlineError message={commonError} /> : null}

              <div className="grid grid-cols-1 gap-4">
                <FormikInputField
                  formik={f}
                  name="email"
                  label={t("auth.email")}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={disabled}
                  onFocus={() => clearAuthError()}
                />

                <FormikInputField
                  formik={f}
                  name="password"
                  label={t("auth.password")}
                  required
                  preset="password"
                  placeholder="••••••••"
                  autoComplete={"new-" + "password"}
                  disabled={disabled}
                  onFocus={() => clearAuthError()}
                />

                <FormikInputField
                  formik={f}
                  name="confirmPassword"
                  label={t("auth.confirmPassword")}
                  required
                  preset="password"
                  placeholder="••••••••"
                  autoComplete={"new-" + "password"}
                  disabled={disabled}
                  onFocus={() => clearAuthError()}
                />
              </div>

              <AuthSubmitButton
                disabled={disabled}
                isSubmitting={disabled}
                idleText={t("auth.createAccount")}
                submittingText={t("auth.creatingAccount")}
              />
            </form>
          );
        }}
      </Formik>
    </AuthFormShell>
  );
};
