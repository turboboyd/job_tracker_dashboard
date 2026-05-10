import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthSelectors } from "src/features/auth/model";

interface AuthRouteGateProps {
  allowAuthenticated: boolean;
  redirectTo: string;
}

export function AuthRouteGate({
  allowAuthenticated,
  redirectTo,
}: AuthRouteGateProps) {
  const { isAuthenticated, isAuthReady } = useAuthSelectors();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="p-4">Checking session...</div>;
  }

  if (isAuthenticated !== allowAuthenticated) {
    return <Navigate to={redirectTo} replace state={{ from: location }} />;
  }

  return <Outlet />;
}
