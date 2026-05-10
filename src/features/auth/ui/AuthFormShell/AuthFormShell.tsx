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
  googleButtonProps?: Omit<GoogleSignInButtonProps, "className"> | null;
  topError?: string | null;
  className?: string;
}

export const AuthFormShell: React.FC<AuthFormShellProps> = ({
  children,
  googleButtonProps,
  topError,
  className,
}) => {
  const { t } = useTranslation();
  const shouldShowGoogle = googleButtonProps !== null;

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      {topError ? (
        <InlineError title={t("auth.errorTitle")} message={topError} />
      ) : null}

      {shouldShowGoogle ? (
        <>
          <GoogleSignInButton {...(googleButtonProps ?? {})} />

          <AuthDivider text={t("auth.or")} />
        </>
      ) : null}

      {children}
    </div>
  );
};
