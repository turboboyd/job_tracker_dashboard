import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  AppRoutes,
  RoutePath,
} from "src/app/providers/router/routeConfig/routeConfig";
import { useAuthSelectors } from "src/entities/auth";
import { AuthPageShell, LoginForm } from "src/features/auth";
import {
  type AuthRedirectLocationState,
  getAuthRedirectFrom,
} from "src/features/auth/lib/authRedirect";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthReady } = useAuthSelectors();

  const navigate = useNavigate();
  const location = useLocation();

  const from = getAuthRedirectFrom(
    location.state as AuthRedirectLocationState | null,
  );

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate, from]);

  return (
    <AuthPageShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={
        <>
          <div>
            {t("auth.noAccount")}{" "}
            <Link
              to={RoutePath[AppRoutes.REGISTER]}
              className="text-foreground hover:underline"
            >
              {t("auth.createAccount")}
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
      <LoginForm
        onSuccess={(target) => navigate(target || from, { replace: true })}
      />
    </AuthPageShell>
  );
};

export default LoginPage;
