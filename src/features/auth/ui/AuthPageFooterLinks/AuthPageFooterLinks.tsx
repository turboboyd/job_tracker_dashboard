import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/shared/config/routes";

export interface AuthPageFooterLinksProps {
  mode: "login" | "register";
}

export const AuthPageFooterLinks: React.FC<AuthPageFooterLinksProps> = ({ mode }) => {
  const { t } = useTranslation();

  const authLink = mode === "login"
    ? {
      href: RoutePath[AppRoutes.REGISTER],
      prefix: t("auth.noAccount"),
      label: t("auth.createAccount"),
    }
    : {
      href: RoutePath[AppRoutes.LOGIN],
      prefix: t("auth.haveAccount"),
      label: t("auth.signIn"),
    };

  return (
    <>
      <div>
        {authLink.prefix}{" "}
        <Link to={authLink.href} className="text-foreground hover:underline">
          {authLink.label}
        </Link>
      </div>
      <div>
        <Link to={RoutePath[AppRoutes.MAIN]} className="hover:underline">
          {t("common.backToHome")}
        </Link>
      </div>
    </>
  );
};
