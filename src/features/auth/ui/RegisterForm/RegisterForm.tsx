import { Formik } from "formik";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthActions, useAuthSelectors } from "src/entities/auth";
import {
  createRegisterSchema,
  type RegisterValues,
} from "src/entities/auth/model/validation";
import { FormikInputField } from "src/shared/ui";

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

const REGISTER_ERROR_OVERRIDES: Record<string, string> = {
  "auth/email-already-in-use": "auth.errors.emailAlreadyInUse",
  // eslint-disable-next-line sonarjs/no-hardcoded-passwords
  "auth/weak-password": "auth.errors.weakPassword",
  "auth/invalid-email": "auth.errors.invalidEmail",
};

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signUpWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createRegisterSchema(t), [t]);

  return (
    <AuthFormShell
      googleButtonProps={{ onSuccess }}
      topError={
        error ? mapFirebaseAuthError(error, t, REGISTER_ERROR_OVERRIDES) : null
      }
    >
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
          const disabled = f.isSubmitting || isLoading;

          return (
            <form onSubmit={f.handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <FormikInputField
                  formik={f}
                  name="email"
                  label={t("auth.email")}
                  required
                  preset="auth"
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
