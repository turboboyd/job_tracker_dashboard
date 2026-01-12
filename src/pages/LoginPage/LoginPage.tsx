import React, { useEffect, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { LoginForm } from "src/features/auth/ui/LoginForm/LoginForm";
import { useAuth } from "src/shared/lib";

type LocationState = { from?: { pathname?: string; search?: string } };

function getFrom(state: LocationState | null): string {
  const fromPath = state?.from?.pathname ?? "/dashboard";
  const fromSearch = state?.from?.search ?? "";
  return `${fromPath}${fromSearch}`;
}

const LoginPage: React.FC = () => {
  const { isAuthenticated, isAuthReady } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = useMemo(
    () => getFrom(location.state as LocationState | null),
    [location.state]
  );

  useEffect(() => {
    if (isAuthReady && isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, [isAuthReady, isAuthenticated, navigate, from]);

  return (
    <div className="min-h-dvh bg-background text-foreground flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold">Вход</h1>
          <p className="text-sm text-muted-foreground">
            Войди через Google, чтобы открыть Dashboard и Jobs.
          </p>
        </div>

        <div className="mt-6">
          <LoginForm onGoogleSuccess={(target) => navigate(target, { replace: true })} />
        </div>

        <div className="pt-4 text-center text-sm text-muted-foreground">
          <Link to="/" className="hover:underline">
            Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
