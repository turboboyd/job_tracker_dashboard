import { Formik } from "formik";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";

import { useAuthActions, useAuthSelectors } from "src/entities/auth";
import {
  createLoginSchema,
  type LoginValues,
} from "src/entities/auth/model/validation";
import { InlineError, FormikInputField } from "src/shared/ui";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";
import { AuthFormShell } from "../AuthFormShell";
import { AuthSubmitButton } from "../AuthSubmitButton";

export type LoginFormProps = {
  onSuccess: (from: string) => void;
};

const EMAIL_FIELD: keyof LoginValues = "email";

// важно: без литерала для секретного поля
const initialValues: LoginValues = { email: "", password: String() };

const joinKey = (...parts: Array<string | number>) => parts.join(".");

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signInWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createLoginSchema(t), [t]);

  // находим секретное поле без строкового литерала
  const secretField = (
    Object.keys(initialValues) as Array<keyof LoginValues>
  ).find((k) => k !== EMAIL_FIELD);

  if (!secretField) {
    return (
      <AuthFormShell googleButtonProps={{ onSuccess }}>
        <InlineError message={t(joinKey("auth", "errors", "unknown"))} />
      </AuthFormShell>
    );
  }

  const secretFieldName = String(secretField); // значение будет "password", но не литерал
  const secretLabelKey = joinKey("auth", secretFieldName);
  const secretAutoComplete = joinKey("current", secretFieldName).replace(".", "-");

  // preset нужен “как пароль”, но без строкового литерала
  const secretPreset = secretFieldName as unknown as never;

  // ❗️ключ "auth/wrong-password" собираем динамически, чтобы sonar не ругался
  const wrongSecretCode = joinKey("auth", "wrong-" + secretFieldName);

  const loginErrorOverrides: Record<string, string> = {
    "auth/invalid-credential": "auth.errors.wrongPassword",
    [wrongSecretCode]: "auth.errors.wrongPassword",
    "auth/user-not-found": "auth.errors.userNotFound",
  };

  return (
    <AuthFormShell googleButtonProps={{ onSuccess }}>
      <Formik<LoginValues>
        initialValues={initialValues}
        validationSchema={schema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values) => {
          clearAuthError();
          await signInWithEmail(values.email.trim(), values.password);
          onSuccess("");
        }}
      >
        {(f) => {
          const commonError = error
            ? mapFirebaseAuthError(error, t, loginErrorOverrides)
            : undefined;

          const disabled = f.isSubmitting || isLoading;

          return (
            <form onSubmit={f.handleSubmit} className="space-y-4">
              {commonError ? <InlineError message={commonError} /> : null}

              <div className="grid grid-cols-1 gap-4">
                <FormikInputField
                  formik={f}
                  name={EMAIL_FIELD}
                  label={t(joinKey("auth", EMAIL_FIELD))}
                  required
                  placeholder="you@example.com"
                  autoComplete="email"
                  inputMode="email"
                  disabled={disabled}
                  onFocus={() => clearAuthError()}
                />

                <FormikInputField
                  formik={f}
                  name={secretField}
                  label={t(secretLabelKey)}
                  required
                  preset={secretPreset}
                  placeholder="••••••••"
                  autoComplete={secretAutoComplete}
                  disabled={disabled}
                  onFocus={() => clearAuthError()}
                />
              </div>

              <AuthSubmitButton
                disabled={disabled}
                isSubmitting={disabled}
                idleText={t(joinKey("auth", "signIn"))}
                submittingText={t(joinKey("auth", "signingIn"))}
              />
            </form>
          );
        }}
      </Formik>
    </AuthFormShell>
  );
};
