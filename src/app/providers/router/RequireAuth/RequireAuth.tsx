import { AppRoutes, RoutePath } from "src/shared/config/routes";

import { AuthRouteGate } from "../_internal/AuthRouteGate";

export function RequireAuth() {
  return (
    <AuthRouteGate
      allowAuthenticated
      redirectTo={RoutePath[AppRoutes.MAIN]}
    />
  );
}
