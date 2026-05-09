import { AppRoutes, RoutePath } from "src/shared/config/routes";

import { AuthRouteGate } from "../_internal/AuthRouteGate";

export function PublicOnly() {
  return (
    <AuthRouteGate
      allowAuthenticated={false}
      redirectTo={RoutePath[AppRoutes.DASHBOARD]}
    />
  );
}
