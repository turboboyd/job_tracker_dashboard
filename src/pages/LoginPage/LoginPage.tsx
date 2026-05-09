import React, { useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import {
  type AuthRedirectLocationState,
  getAuthRedirectFrom,
} from "src/features/auth/lib";
import { useAuthActions, useAuthSelectors } from "src/features/auth/model";
import { AuthPageFooterLinks } from "src/features/auth/ui/AuthPageFooterLinks";
import { AuthPageShell } from "src/features/auth/ui/AuthPageShell";
import { LoginForm } from "src/features/auth/ui/LoginForm";

const LoginPage: React.FC = () => {
  const { t } = useTranslation();
  const { isAuthenticated, isAuthReady } = useAuthSelectors();
  const { clearAuthError } = useAuthActions();

  const navigate = useNavigate();
  const location = useLocation();

  const from = getAuthRedirectFrom(
    location.state as AuthRedirectLocationState | null,
  );

  const redirectToTarget = useCallback((target?: string) => {
    void navigate(target ?? from, { replace: true });
  }, [from, navigate]);

  useEffect(() => {
    clearAuthError();
  }, [clearAuthError]);

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      redirectToTarget();
    }
  }, [isAuthReady, isAuthenticated, redirectToTarget]);

  return (
    <AuthPageShell
      title={t("auth.loginTitle")}
      subtitle={t("auth.loginSubtitle")}
      footer={<AuthPageFooterLinks mode="login" />}
    >
      <LoginForm onSuccess={redirectToTarget} />
    </AuthPageShell>
  );
};

export default LoginPage;
