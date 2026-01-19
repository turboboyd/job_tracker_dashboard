import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "src/shared/lib/auth/useAuth";

export const RequireAuth: React.FC = () => {
  const { isAuthenticated, isAuthReady } = useAuth();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="p-4">Checking session...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
};
