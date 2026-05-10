import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { useAuthActions, useAuthSelectors } from "src/features/auth/model";
import { AuthPageFooterLinks } from "src/features/auth/ui/AuthPageFooterLinks";
import { AuthPageShell } from "src/features/auth/ui/AuthPageShell";
import { RegisterForm } from "src/features/auth/ui/RegisterForm";
import { AppRoutes, RoutePath } from "src/shared/config/routes";

const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthReady } = useAuthSelectors();
  const { clearAuthError } = useAuthActions();
  const navigate = useNavigate();
  const mainPath = `${RoutePath[AppRoutes.MAIN]}`;

  const redirectToMain = useCallback(() => {
    void navigate(mainPath, { replace: true });
  }, [mainPath, navigate]);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      redirectToMain();
    }
  }, [isAuthReady, isAuthenticated, redirectToMain]);

  return (
    <AuthPageShell
      title={t("auth.registerTitle")}
      subtitle={t("auth.registerSubtitle")}
      footer={<AuthPageFooterLinks mode="register" />}
    >
      <RegisterForm onSuccess={redirectToMain} />
    </AuthPageShell>
  );
};

export default RegisterPage;
