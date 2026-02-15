import React from "react";
import { useTranslation } from "react-i18next";
import { useLocation } from "react-router-dom";


import { useAuthActions, useAuthSelectors } from "src/entities/auth";
import { Button } from "src/shared/ui";
import { GoogleIcon } from "src/shared/ui/icons/GoogleIcon";

import {
  type AuthRedirectLocationState,
  getAuthRedirectFrom,
} from "../../lib/authRedirect";
import { mapGoogleAuthError } from "../../lib/firebaseAuthErrors";


export type GoogleSignInButtonProps = {
  onSuccess?: (from: string) => void;
  onError?: (message: string) => void;
  className?: string;
};

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  onSuccess,
  onError,
  className,
}) => {
  const { t } = useTranslation();
  const { signInWithGoogle, clearAuthError } = useAuthActions();
  const { isLoading, error } = useAuthSelectors();

  const location = useLocation();

  const onClick = async () => {
    clearAuthError();

    try {
      await signInWithGoogle();
      const from = getAuthRedirectFrom(
        location.state as AuthRedirectLocationState | null,
      );
      onSuccess?.(from);
    } catch (e: unknown) {
      onError?.(mapGoogleAuthError(e, t));
    }
  };

  const disabled = isLoading;

  return (
    <div className="space-y-2">
      <Button
        variant="outline"
        className={["w-full justify-center gap-2", className]
          .filter(Boolean)
          .join(" ")}
        onClick={onClick}
        disabled={disabled}
      >
        <GoogleIcon className="h-4 w-4" />
        {disabled ? t("auth.google.opening") : t("auth.google.signIn")}
      </Button>

      {error ? (
        <div className="text-xs text-muted-foreground">
          {mapGoogleAuthError(error, t)}
        </div>
      ) : null}
    </div>
  );
};
