import { useCallback, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { AuthRedirectLocationState } from "src/shared/lib";
import { getAuthRedirectFrom } from "src/shared/lib";

export function useAuthRedirect(defaultPath = "/") {
  const location = useLocation();
  const navigate = useNavigate();

  const from = useMemo(() => {
    return getAuthRedirectFrom(
      location.state as AuthRedirectLocationState | null,
      defaultPath,
    );
  }, [location.state, defaultPath]);

  const redirect = useCallback((to?: string) => {
    void navigate(to ?? from, { replace: true });
  }, [from, navigate]);

  return { from, redirect };
}
