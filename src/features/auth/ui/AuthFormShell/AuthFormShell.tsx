import React from "react";
import { useTranslation } from "react-i18next";

import { AuthDivider } from "../AuthDivider";
import {
  GoogleSignInButton,
  type GoogleSignInButtonProps,
} from "../GoogleSignInButton/GoogleSignInButton";

export type AuthFormShellProps = {
  children: React.ReactNode;
  googleButtonProps?: Omit<GoogleSignInButtonProps, "className">;
  className?: string;
};

export const AuthFormShell: React.FC<AuthFormShellProps> = ({
  children,
  googleButtonProps,
  className,
}) => {
  const { t } = useTranslation();

  return (
    <div className={["space-y-4", className].filter(Boolean).join(" ")}>
      <GoogleSignInButton {...googleButtonProps} />
      <AuthDivider text={t("auth.or")} />
      {children}
    </div>
  );
};
