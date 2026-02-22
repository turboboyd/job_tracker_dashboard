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

const initialValues: LoginValues = { email: "", password: String() };

const joinKey = (...parts: Array<string | number>) => parts.join(".");

export const LoginForm: React.FC<LoginFormProps> = ({ onSuccess }) => {
  const { t } = useTranslation();

  const { signInWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const schema = useMemo(() => createLoginSchema(t), [t]);
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

  const secretFieldName = String(secretField); 
  const secretLabelKey = joinKey("auth", secretFieldName);
  const secretAutoComplete = joinKey("current", secretFieldName).replace(".", "-");


  // For password-like fields use the dedicated preset (adds toggle, etc.)
  const secretPreset = secretFieldName === "password" ? "password" : "default";

  const wrongSecretCode = joinKey("auth", "wrong-" + secretFieldName);

  const loginErrorOverrides: Record<string, string> = {
    "auth/invalid-credential": "auth.errors.wrongPassword",
    [wrongSecretCode]: "auth.errors.wrongPassword",
    "auth/user-not-found": "auth.errors.wrongPassword",
      // eslint-disable-next-line sonarjs/no-hardcoded-passwords 
    "auth/wrong-password": "auth.errors.wrongPassword",
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
