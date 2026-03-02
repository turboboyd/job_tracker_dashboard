/* eslint-disable @typescript-eslint/no-floating-promises */
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import type { AuthRedirectLocationState} from "src/features/auth/lib/authRedirect";
import { getAuthRedirectFrom } from "src/features/auth/lib/authRedirect";




export function useAuthRedirect(defaultPath = "/") {
  const location = useLocation();
  const navigate = useNavigate();

  const from = useMemo(() => {
    return getAuthRedirectFrom(
      location.state as AuthRedirectLocationState | null,
      defaultPath,
    );
  }, [location.state, defaultPath]);

  function redirect(to?: string) {
    navigate(to ?? from, { replace: true });
  }

  return { from, redirect };
}
