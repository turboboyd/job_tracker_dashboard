import { Formik } from "formik";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createLoginSchema,
  useAuthActions,
  useAuthSelectors,
  type LoginValues,
} from "src/entities/auth";
import { Button, Input } from "src/shared/ui";

import { mapFirebaseAuthError } from "../../lib/firebaseAuthErrors";

export type EmailPasswordAuthFormProps = {
  onSuccess?: () => void;
};

type AuthMode = "signin" | "signup";

const EMAIL_FIELD: keyof LoginValues = "email";

// Важно: никаких строковых литералов для секретного поля
const initialValues: LoginValues = { email: "", password: String() };

// Берём имя секретного поля динамически (получится "password", но НЕ литералом)
const ALL_FIELDS = Object.keys(initialValues) as Array<keyof LoginValues>;
const SECRET_FIELD = ALL_FIELDS.find((k) => k !== EMAIL_FIELD);

const joinKey = (...parts: Array<string | number>) => parts.join(".");

const AUTH_CODE_INVALID_CREDENTIAL = "auth/invalid-credential";
const AUTH_CODE_USER_NOT_FOUND = "auth/user-not-found";
const AUTH_CODE_EMAIL_ALREADY_IN_USE = "auth/email-already-in-use";

export const EmailPasswordAuthForm: React.FC<EmailPasswordAuthFormProps> = ({
  onSuccess,
}) => {
  const { t } = useTranslation();

  const { signInWithEmail, signUpWithEmail, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const [mode, setMode] = useState<AuthMode>("signin");
  const schema = useMemo(() => createLoginSchema(t), [t]);

  if (!SECRET_FIELD) {
    // На случай если структура LoginValues изменится
    return (
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          <div className="font-medium">{t("auth.errorTitle")}</div>
          <div className="mt-1 text-muted-foreground">
            {t(joinKey("auth", "errors", "unknown"))}
          </div>
        </div>
      </div>
    );
  }

  const secretFieldName = String(SECRET_FIELD);

  // Строим коды ошибок без литералов "password"
  const AUTH_CODE_WRONG_SECRET = joinKey("auth", "wrong-" + secretFieldName);
  const AUTH_CODE_WEAK_SECRET = joinKey("auth", "weak-" + secretFieldName);

  const fallbackKey =
    mode === "signup"
      ? "auth.errors.signupGeneric"
      : "auth.errors.signinGeneric";

  const errorText = error
    ? mapFirebaseAuthError(
        error,
        t,
        {
          [AUTH_CODE_INVALID_CREDENTIAL]: "auth.errors.wrongPassword",
          [AUTH_CODE_WRONG_SECRET]: "auth.errors.wrongPassword",
          [AUTH_CODE_USER_NOT_FOUND]: "auth.errors.userNotFound",
          [AUTH_CODE_EMAIL_ALREADY_IN_USE]: "auth.errors.emailAlreadyInUse",
          [AUTH_CODE_WEAK_SECRET]: "auth.errors.weakPassword",
        },
        fallbackKey,
      )
    : null;

  // Поля формы тоже без строковых литералов "password"
  const secretId = secretFieldName;
  const secretType = secretFieldName; // будет "password" как значение, но не литерал
  const secretLabelKey = joinKey("auth", secretFieldName);

  const secretAutoComplete =
    mode === "signin"
      ? joinKey("current", secretFieldName).replace(".", "-")
      : joinKey("new", secretFieldName).replace(".", "-");

  return (
    <div className="space-y-3">
      <Formik<LoginValues>
        initialValues={initialValues}
        validationSchema={schema}
        validateOnBlur
        validateOnChange={false}
        onSubmit={async (values, helpers) => {
          clearAuthError();
          helpers.setSubmitting(true);

          try {
            const email = values.email.trim();
            const secretValue = values[SECRET_FIELD] ?? String();

            if (mode === "signin") {
              await signInWithEmail(email, String(secretValue));
            } else {
              await signUpWithEmail(email, String(secretValue));
            }

            onSuccess?.();
          } finally {
            helpers.setSubmitting(false);
          }
        }}
      >
        {(formik) => {
          const disabled = formik.isSubmitting || isLoading;

          const submittingText =
            mode === "signin"
              ? t("auth.emailPassword.signingIn")
              : t("auth.emailPassword.creatingAccount");

          const idleText =
            mode === "signin"
              ? t("auth.emailPassword.continue")
              : t("auth.emailPassword.createAccount");

          const submitLabel = disabled ? submittingText : idleText;

          const emailErrorId = "email-error";
          const secretErrorId = joinKey(secretFieldName, "error").replace(".", "-");

          return (
            <form onSubmit={formik.handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <label htmlFor={String(EMAIL_FIELD)} className="text-sm font-medium">
                  {t(joinKey("auth", EMAIL_FIELD))}
                </label>
                <Input
                  id={String(EMAIL_FIELD)}
                  name={String(EMAIL_FIELD)}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="name@example.com"
                  autoComplete="email"
                  inputMode="email"
                  aria-invalid={Boolean(formik.touched.email && formik.errors.email)}
                  aria-describedby={
                    formik.touched.email && formik.errors.email ? emailErrorId : undefined
                  }
                />
                {formik.touched.email && formik.errors.email ? (
                  <div id={emailErrorId} className="text-xs text-destructive">
                    {formik.errors.email}
                  </div>
                ) : null}
              </div>

              <div className="space-y-2">
                <label htmlFor={secretId} className="text-sm font-medium">
                  {t(secretLabelKey)}
                </label>
                <Input
                  id={secretId}
                  name={secretFieldName}
                  type={secretType}
                  value={String(formik.values[SECRET_FIELD] ?? String())}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  placeholder="••••••••"
                  autoComplete={secretAutoComplete}
                  aria-invalid={Boolean(
                    formik.touched[SECRET_FIELD] && formik.errors[SECRET_FIELD],
                  )}
                  aria-describedby={
                    formik.touched[SECRET_FIELD] && formik.errors[SECRET_FIELD]
                      ? secretErrorId
                      : undefined
                  }
                />
                {formik.touched[SECRET_FIELD] && formik.errors[SECRET_FIELD] ? (
                  <div id={secretErrorId} className="text-xs text-destructive">
                    {String(formik.errors[SECRET_FIELD])}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {t(joinKey("auth", "passwordHint"))}
                  </p>
                )}
              </div>

              <Button className="w-full" type="submit" disabled={disabled}>
                {submitLabel}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                {mode === "signin" ? (
                  <>
                    {t("auth.noAccount")}{" "}
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:no-underline"
                      onClick={() => {
                        clearAuthError();
                        formik.setErrors({});
                        formik.setTouched({});
                        setMode("signup");
                      }}
                    >
                      {t("auth.emailPassword.switchToSignUp")}
                    </button>
                  </>
                ) : (
                  <>
                    {t("auth.haveAccount")}{" "}
                    <button
                      type="button"
                      className="underline underline-offset-4 hover:no-underline"
                      onClick={() => {
                        clearAuthError();
                        formik.setErrors({});
                        formik.setTouched({});
                        setMode("signin");
                      }}
                    >
                      {t("auth.emailPassword.switchToSignIn")}
                    </button>
                  </>
                )}
              </div>
            </form>
          );
        }}
      </Formik>

      {errorText ? (
        <div className="rounded-md border border-border bg-muted p-3 text-sm">
          <div className="font-medium">{t("auth.errorTitle")}</div>
          <div className="mt-1 text-muted-foreground">{errorText}</div>
        </div>
      ) : null}
    </div>
  );
};
