import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { AppRoutes, RoutePath } from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth";
import { AuthPageShell, RegisterForm } from "src/features/auth/ui";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthReady } = useAuthSelectors();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      navigate(`${RoutePath[AppRoutes.MAIN]}`, { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate]);

  return (
    <AuthPageShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={
        <>
          <div>
            {t("auth.haveAccount")}{" "}
            <Link to={RoutePath[AppRoutes.LOGIN]} className="text-foreground hover:underline">
              {t("auth.signIn")}
            </Link>
          </div>
          <div>
            <Link to={RoutePath[AppRoutes.MAIN]} className="hover:underline">
              {t("common.backToHome")}
            </Link>
          </div>
        </>
      }
    >
      <RegisterForm
        onSuccess={() => navigate(`${RoutePath[AppRoutes.MAIN]}`, { replace: true })}
      />
    </AuthPageShell>
  );
};

export default RegisterPage;
