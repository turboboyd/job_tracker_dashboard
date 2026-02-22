import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuthSelectors } from "src/entities/auth";

import { AppRoutes, RoutePath } from "../routeConfig/routeConfig";


export const PublicOnly: React.FC = () => {
  const { isAuthenticated, isAuthReady } = useAuthSelectors();
  const location = useLocation();

  if (!isAuthReady) {
    return <div className="p-4">Checking session...</div>;
  }

  if (isAuthenticated) {
    return (
      <Navigate
        to={RoutePath[AppRoutes.DASHBOARD]}
        replace
        state={{ from: location }}
      />
    );
  }

  return <Outlet />;
};