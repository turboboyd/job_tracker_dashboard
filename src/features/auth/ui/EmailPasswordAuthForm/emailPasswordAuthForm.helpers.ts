import type { TFunction } from "i18next";

import type { AuthSubmitLabels } from "../authForms.helpers";

export type AuthMode = "signin" | "signup";

export const EMAIL_PASSWORD_INITIAL_VALUES = { email: "", password: "" };

export function getEmailPasswordFallbackKey(mode: AuthMode): string {
  return mode === "signup"
    ? "auth.errors.signupGeneric"
    : "auth.errors.signinGeneric";
}

export function getEmailPasswordAutoComplete(mode: AuthMode): string {
  return mode === "signin" ? "current-password" : "new-password";
}

export function buildEmailPasswordSubmitLabels(
  t: TFunction,
  mode: AuthMode,
): AuthSubmitLabels {
  if (mode === "signup") {
    return {
      idleText: t("auth.emailPassword.createAccount"),
      submittingText: t("auth.emailPassword.creatingAccount"),
    };
  }

  return {
    idleText: t("auth.emailPassword.continue"),
    submittingText: t("auth.emailPassword.signingIn"),
  };
}
