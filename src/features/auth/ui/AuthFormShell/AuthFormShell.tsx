import React from "react";
import { useTranslation } from "react-i18next";

import { InlineError } from "src/shared/ui";

import { AuthDivider } from "../AuthDivider";
import {
  GoogleSignInButton,
  type GoogleSignInButtonProps,
} from "../GoogleSignInButton/GoogleSignInButton";

export interface AuthFormShellProps {
  children: React.ReactNode;
  googleButtonProps?: Omit<GoogleSignInButtonProps, "className">;
  topError?: string | null;
  className?: string;
}

export const AuthFormShell: React.FC<AuthFormShellProps> = ({
  children,
  googleButtonProps,
  topError,
  className,
}) => {
  // В твоём проекте "auth" — это объект внутри default namespace (translation),
  // поэтому используем ключи вида "auth.xxx", без useTranslation("auth").
  const { t } = useTranslation();

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      {topError ? (
        <InlineError title={t("auth.errorTitle")} message={topError} />
      ) : null}

      <GoogleSignInButton {...googleButtonProps} />

      <AuthDivider text={t("auth.or")} />

      {children}
    </div>
  );
};
